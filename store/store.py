#!/usr/bin/env python3
"""KayaNET İçerik Mağazası servisi: sade "İçerik Ekle" sayfasının arka ucu. Port 8084.
KayaNET Content Store service: backend of the simple "Add content" page. Port 8084.

- Yalnızca config/content.conf içindeki ZIM'leri indirebilir (başka adres/komut kabul etmez).
  Only ZIMs listed in config/content.conf can be downloaded (no other URL or command accepted).
- Yazma işlemleri yönetici PIN'i ister (/etc/kayanet/pin). Okuma (durum, liste) açıktır.
  Writes need the admin PIN (/etc/kayanet/pin). Reading status/catalog is open.
- /system (yeniden başlat/kapat) ve /setpin (PIN değiştir) da PIN ister.
- İndirmeyi scripts/download-content.sh yapar (devam ettirme, sha256, boş yer kontrolü).
  The actual download is done by scripts/download-content.sh (resume, sha256, free-space check).
Yalnızca standart kütüphane / standard library only.
"""
import glob, hmac, json, os, re, shutil, subprocess, tempfile, threading, time, urllib.request
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

REPO = os.environ.get("REPO", os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
CONF = os.path.join(REPO, "config", "content.conf")
DEST = os.environ.get("DEST", "/library/zims/content")
PIN_FILE = "/etc/kayanet/pin"
PORT = int(os.environ.get("PORT", "8084"))

def catalog():
    items = []
    for line in open(CONF, encoding="utf8"):
        m = re.match(r"^(\S+)\s+(\S+)\s*(?:#\s*(.*))?$", line.strip())
        if not m or line.lstrip().startswith("#"): continue
        folder, prefix, note = m.group(1), m.group(2), (m.group(3) or "")
        sz = re.search(r"~?\s*([\d.,]+)\s*(GB|MB)", note)
        mb = None
        if sz: mb = float(sz.group(1).replace(",", ".")) * (1024 if sz.group(2) == "GB" else 1)
        items.append({"folder": folder, "prefix": prefix, "note": note.strip(), "mb": mb})
    return items

CAT = catalog()
CAT_BY = {c["prefix"]: c for c in CAT}
JOB = {"running": False, "items": [], "log": [], "started": 0, "rc": None}
LOCK = threading.Lock()
FAILS = {}

def installed():
    names = [os.path.basename(f) for f in glob.glob(os.path.join(DEST, "*.zim"))]
    return sorted({c["prefix"] for c in CAT for n in names if n.startswith(c["prefix"] + "_")})

def internet():
    try: urllib.request.urlopen("https://download.kiwix.org/", timeout=5); return True
    except Exception: return False

def check_pin(ip, pin):
    if FAILS.get(ip, (0, 0))[0] >= 5 and time.time() - FAILS[ip][1] < 300: return False
    try: real = open(PIN_FILE).read().strip()
    except OSError: return False
    ok = bool(real) and hmac.compare_digest(str(pin).strip(), real)
    if ok: FAILS.pop(ip, None)
    else: FAILS[ip] = (FAILS.get(ip, (0, 0))[0] + 1, time.time())
    return ok

def run_job(sel):
    conf = tempfile.NamedTemporaryFile("w", suffix=".conf", delete=False)
    for p in sel: conf.write(f"{CAT_BY[p]['folder']} {p}\n")
    conf.close()
    try:
        pr = subprocess.Popen([os.path.join(REPO, "scripts", "download-content.sh"), conf.name], stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
        for line in pr.stdout:
            line = line.rstrip()[-300:]
            if line: JOB["log"] = (JOB["log"] + [line])[-40:]
        JOB["rc"] = pr.wait()
    except Exception as e:
        JOB["log"].append(f"hata/error: {e}"); JOB["rc"] = 1
    finally:
        os.unlink(conf.name); JOB["running"] = False

class H(BaseHTTPRequestHandler):
    def log_message(self, *a): pass
    def _json(self, code, obj):
        b = json.dumps(obj, ensure_ascii=False).encode()
        self.send_response(code); self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Access-Control-Allow-Origin", "*"); self.send_header("Content-Length", str(len(b))); self.end_headers(); self.wfile.write(b)
    def do_OPTIONS(self):
        self.send_response(204); self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "Content-Type"); self.end_headers()
    def do_GET(self):
        if self.path.startswith("/catalog"): return self._json(200, CAT)
        if self.path.startswith("/status"):
            du = shutil.disk_usage(DEST if os.path.isdir(DEST) else "/")
            return self._json(200, {"internet": internet(), "free_mb": du.free // 2**20, "installed": installed(), "job": JOB})
        self._json(404, {"error": "yok"})
    def do_POST(self):
        try: d = json.loads(self.rfile.read(int(self.headers.get("Content-Length", 0)) or 0))
        except Exception: return self._json(400, {"error": "geçersiz istek"})
        if not check_pin(self.client_address[0], d.get("pin", "")): return self._json(403, {"error": "PIN yanlış ya da çok fazla deneme"})
        if self.path.startswith("/download"):
            sel = [p for p in d.get("items", []) if p in CAT_BY]
            if not sel: return self._json(400, {"error": "geçerli içerik seçilmedi"})
            with LOCK:
                if JOB["running"]: return self._json(409, {"error": "bir indirme zaten sürüyor"})
                JOB.update(running=True, items=sel, log=[], started=int(time.time()), rc=None)
            threading.Thread(target=run_job, args=(sel,), daemon=True).start()
            return self._json(200, {"started": sel})
        if self.path.startswith("/system"):
            act = d.get("action")
            cmd = {"reboot": ["systemctl", "reboot"], "poweroff": ["systemctl", "poweroff"]}.get(act)
            if not cmd: return self._json(400, {"error": "bilinmeyen işlem"})
            self._json(200, {"ok": True, "action": act})
            threading.Timer(2, lambda: subprocess.Popen(cmd)).start()
            return
        if self.path.startswith("/setpin"):
            new = str(d.get("new", "")).strip()
            if not re.fullmatch(r"\d{4,12}", new): return self._json(400, {"error": "PIN 4-12 rakam olmalı"})
            with open(PIN_FILE, "w") as f: f.write(new + "\n")
            os.chmod(PIN_FILE, 0o600)
            return self._json(200, {"ok": True})
        self._json(404, {"error": "yok"})

if __name__ == "__main__":
    ThreadingHTTPServer(("0.0.0.0", PORT), H).serve_forever()
