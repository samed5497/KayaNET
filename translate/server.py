"""KayaNET çevrimdışı çeviri servisi (Argos Translate, torch'suz). 127.0.0.1:8082 POST /translate {q, source, target}
KayaNET offline translation service (Argos Translate, torch-free). Only reachable from the Pi itself; nginx proxies /kn-translate."""
import json
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import argostranslate.settings as s
s.chunk_type = s.ChunkType.MINISBD
import argostranslate.translate as t

class H(BaseHTTPRequestHandler):
    def do_POST(self):
        if self.path != "/translate":
            self.send_response(404); self.end_headers(); return
        try:
            d = json.loads(self.rfile.read(int(self.headers.get("Content-Length", 0))) or b"{}")
            out = t.translate(d["q"][:5000], d.get("source", "auto"), d["target"])
            body = json.dumps({"translatedText": out}, ensure_ascii=False).encode(); code = 200
        except Exception as e:
            body = json.dumps({"error": str(e)}).encode(); code = 400
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body))); self.end_headers(); self.wfile.write(body)
    def log_message(self, *a): pass

ThreadingHTTPServer(("127.0.0.1", 8082), H).serve_forever()
