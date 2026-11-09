#!/usr/bin/env python3
"""KayaNET "Sor" servisi: soruyu Kiwix'te arar, bulunan metinle yerel LLM'e (llama-server) cevap verdirir.
KayaNET "Ask" service: searches Kiwix for the question, feeds the found text to the local LLM (llama-server).
Yalnızca standart kütüphane / standard library only. Port 8081, CORS açık / CORS open.

Ortam / env: KIWIX=http://localhost/kiwix  LLM=http://127.0.0.1:8080  PORT=8081  TOP=3  CTX_CHARS=3500
"""
import json, os, re, sys, urllib.parse, urllib.request, html as htmllib
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from xml.etree import ElementTree as ET

KIWIX = os.environ.get("KIWIX", "http://localhost/kiwix").rstrip("/")
LLM = os.environ.get("LLM", "http://127.0.0.1:8080").rstrip("/")
PORT = int(os.environ.get("PORT", "8081"))
TOP = int(os.environ.get("TOP", "3"))
CTX_CHARS = int(os.environ.get("CTX_CHARS", "3500"))
STOP = set("ve veya ile bir bu şu o için ne nasıl neden nedir nelerdir mı mi mu mü da de ki gibi en çok daha var yok ben sen biz the a an of to in is are how what why do does i my can should and or for on with".split())
SYSTEM = ("Sen KayaNET adlı çevrimdışı bilgi kutusunun asistanısın. Yalnızca verilen KAYNAK metinlerine dayanarak, "
          "kısa, net ve adım adım Türkçe cevap ver. Kaynak yoksa kısaca bildiğini söyle, emin değilsen 'emin değilim' de, uydurma. "
          "Tıbbi/acil konularda ciddi durumlarda mutlaka 112'yi aramayı hatırlat.")

def get(url, timeout=20):
    with urllib.request.urlopen(url, timeout=timeout) as r:
        return r.read().decode("utf-8", "replace")

def words(s):
    return [w for w in re.findall(r"\w+", s.lower()) if w not in STOP and len(w) > 2]

def to_en(q):
    """TR soruyu EN'e çevir (İngilizce ZIM'lerde arama için); servis yoksa None."""
    try:
        req = urllib.request.Request("http://127.0.0.1:8082/translate", data=json.dumps({"q": q, "source": "tr", "target": "en"}).encode(),
                                     headers={"Content-Type": "application/json"})
        with urllib.request.urlopen(req, timeout=15) as r:
            return json.loads(r.read().decode()).get("translatedText") or None
    except Exception as e:
        print("çeviri hata:", e, file=sys.stderr); return None

def search(q, lang="eng"):
    """Kiwix tam metin arama / full-text search. [(başlık, yol)]"""
    kw = " ".join(words(q)) or q
    url = f"{KIWIX}/search?pattern={urllib.parse.quote(kw)}&format=xml&pageLength={TOP + 2}&books.filter.lang={lang}"
    out = []
    try:
        root = ET.fromstring(get(url))
        for it in root.iter("item"):
            link = (it.findtext("link") or "").strip()
            if link:
                out.append((re.sub(r"<[^>]+>", "", it.findtext("title") or link), link))
    except Exception as e:
        print("search hata:", e, file=sys.stderr)
    return out[:TOP]

def page_text(link):
    url = urllib.parse.urljoin(KIWIX + "/", link)
    h = get(url)
    h = re.sub(r"(?is)<(script|style|nav|table).*?</\1>", " ", h)
    h = re.sub(r"(?is)<(p|li|h[1-6]|div|br)[^>]*>", "\n", h)
    return re.sub(r"[ \t]+", " ", htmllib.unescape(re.sub(r"<[^>]+>", " ", h)))

def best_chunks(text, qw, n=3, size=900):
    paras = [p.strip() for p in text.split("\n") if len(p.strip()) > 40]
    chunks, cur = [], ""
    for p in paras:
        if len(cur) + len(p) > size: chunks.append(cur); cur = ""
        cur += p + " "
    if cur: chunks.append(cur)
    def score(c):
        lc = c.lower(); return sum(lc.count(w) for w in set(qw))
    ranked = sorted(range(len(chunks)), key=lambda i: -score(chunks[i]))[:n]
    return [chunks[i] for i in sorted(ranked) if score(chunks[i]) > 0] or chunks[:1]

def build_context(q):
    en = to_en(q)
    qw, src, ctx, left = words(q) + (words(en) if en else []), [], [], CTX_CHARS
    hits, seen = [], set()
    for qq, lg in ([(en, "eng")] if en else []) + [(q, "tur")]:
        for h in search(qq, lg):
            if h[1] not in seen: seen.add(h[1]); hits.append(h)
    for title, link in hits[:TOP + 2]:
        try:
            parts = best_chunks(page_text(link), qw, n=2)
        except Exception as e:
            print("sayfa hata:", e, file=sys.stderr); continue
        txt = " ".join(parts)[:max(300, left // 2)]
        ctx.append(f"[KAYNAK: {title}]\n{txt}"); src.append({"title": title, "url": link}); left -= len(txt)
        if left < 300: break
    return "\n\n".join(ctx), src

class H(BaseHTTPRequestHandler):
    def log_message(self, *a): pass
    def _cors(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "content-type")
    def _json(self, code, obj):
        b = json.dumps(obj, ensure_ascii=False).encode()
        self.send_response(code); self._cors(); self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(b))); self.end_headers(); self.wfile.write(b)
    def do_OPTIONS(self): self.send_response(204); self._cors(); self.end_headers()
    def do_GET(self):
        if self.path.startswith("/status"):
            try: get(LLM + "/health", 3); ok = True
            except Exception: ok = False
            return self._json(200, {"llm": ok})
        self._json(404, {"error": "yok"})
    def do_POST(self):
        if not self.path.startswith("/ask"): return self._json(404, {"error": "yok"})
        try:
            q = json.loads(self.rfile.read(int(self.headers.get("Content-Length", 0)) or 0))["q"].strip()[:500]
        except Exception: return self._json(400, {"error": "q gerekli"})
        if not q: return self._json(400, {"error": "q gerekli"})
        self.send_response(200); self._cors()
        self.send_header("Content-Type", "text/event-stream"); self.send_header("Cache-Control", "no-cache"); self.end_headers()
        def ev(o): self.wfile.write(b"data: " + json.dumps(o, ensure_ascii=False).encode() + b"\n\n"); self.wfile.flush()
        try:
            ev({"stage": "Kaynaklar aranıyor..."})
            ctx, src = build_context(q)
            ev({"sources": src})
            if not ctx:
                ev({"token": "(Çevrimdışı kaynaklarda bulunamadı; modelin genel bilgisiyle cevaplanıyor, doğruluğunu kontrol edin.)\n\n"})
                ctx = "(kaynak yok)"
            ev({"stage": "Cevap hazırlanıyor (Pi'de ilk kelime biraz sürebilir)..."})
            body = {"stream": True, "temperature": 0.2, "max_tokens": 400,
                    "chat_template_kwargs": {"enable_thinking": False},
                    "messages": [{"role": "system", "content": SYSTEM},
                                 {"role": "user", "content": f"{ctx}\n\nSORU: {q} /no_think"}]}
            req = urllib.request.Request(LLM + "/v1/chat/completions", json.dumps(body).encode(), {"Content-Type": "application/json"})
            buf, hidden = "", False
            with urllib.request.urlopen(req, timeout=600) as r:
                for line in r:
                    line = line.decode().strip()
                    if not line.startswith("data:") or line.endswith("[DONE]"): continue
                    tok = json.loads(line[5:])["choices"][0]["delta"].get("content") or ""
                    buf += tok
                    if "<think>" in buf and "</think>" not in buf: continue  # düşünme bloğunu gizle
                    if "</think>" in buf: buf = buf.split("</think>", 1)[1].lstrip(); ev({"reset": True}); tok = buf; buf = "x"
                    if tok: ev({"token": tok})
            ev({"done": True})
        except (BrokenPipeError, ConnectionResetError): pass
        except Exception as e:
            try: ev({"error": f"Yapay zeka servisi yanıt vermedi ({e}). Normal aramayı kullanın."})
            except Exception: pass

if __name__ == "__main__":
    ThreadingHTTPServer(("0.0.0.0", PORT), H).serve_forever()
