#!/usr/bin/env bash
# Çevrimdışı çeviri servisi: Argos Translate (TR<->EN), torch'suz, 127.0.0.1:8082 /translate (+ nginx /kn-translate)
# Offline translation service: Argos Translate (TR<->EN), torch-free, 127.0.0.1:8082 /translate (+ nginx /kn-translate)
# Tekrar çalıştırmak güvenlidir / safe to re-run.   Kullanım / usage:  sudo ./scripts/install-translate.sh
set -euo pipefail
REPO="$(cd "$(dirname "$0")/.." && pwd)"
[ "$EUID" -eq 0 ] || { echo "sudo ile çalıştır / run with sudo" >&2; exit 1; }
USER_NAME="${SUDO_USER:-kaya}"
HOME_DIR=$(getent passwd "$USER_NAME" | cut -d: -f6)
VENV="$HOME_DIR/argos-venv"; SVC="$HOME_DIR/argos-service"; TMP="$HOME_DIR/pip-tmp"

avail_mb=$(df -BM --output=avail "$HOME_DIR" | tail -1 | tr -dc 0-9)
[ -x "$VENV/bin/python" ] || [ "$avail_mb" -ge 2500 ] || { echo "Yetersiz boş alan / not enough free space: ${avail_mb} MB" >&2; exit 1; }

run() { sudo -u "$USER_NAME" env TMPDIR="$TMP" "$@"; }
sudo -u "$USER_NAME" mkdir -p "$TMP" "$SVC"
[ -x "$VENV/bin/python" ] || sudo -u "$USER_NAME" python3 -m venv "$VENV"

# torch/CUDA (birkaç GB) çekmemek için bağımlılıklar elle / deps by hand to avoid torch+CUDA (several GB)
run "$VENV/bin/pip" install -q --no-cache-dir --no-deps argostranslate
run "$VENV/bin/pip" install -q --no-cache-dir ctranslate2 sentencepiece minisbd onnxruntime numpy requests packaging pyyaml tqdm "sacremoses<0.2"
SP=$("$VENV/bin/python" -c 'import site;print(site.getsitepackages()[0])')
if [ ! -d "$SP/stanza" ]; then   # argostranslate 'import stanza' yapar; MiniSBD kullanıldığı için boş kalıp yeter
  sudo -u "$USER_NAME" mkdir -p "$SP/stanza"; echo "# stub: torch yok / no torch; minisbd kullanılır" | sudo -u "$USER_NAME" tee "$SP/stanza/__init__.py" >/dev/null
fi

# TR<->EN dil paketleri (Argos resmi indeksi) / language packs (official Argos index)
sudo -u "$USER_NAME" env TMPDIR="$TMP" "$VENV/bin/python" - <<'PY'
import argostranslate.package as p, argostranslate.translate as t
p.update_package_index(); av = p.get_available_packages()
inst = {(pk.from_code, pk.to_code) for pk in p.get_installed_packages()}
for a, b in (("tr", "en"), ("en", "tr")):
    if (a, b) in inst: continue
    pk = next(k for k in av if k.from_code == a and k.to_code == b)
    p.install_from_path(pk.download())
print("dil paketleri hazır / language packs ready")
PY

install -o "$USER_NAME" -m 644 "$REPO/translate/server.py" "$SVC/server.py"
sed -e "s#@USER@#$USER_NAME#g" -e "s#@HOME@#$HOME_DIR#g" "$REPO/saglik/kayanet-translate.service" > /etc/systemd/system/kayanet-translate.service
systemctl daemon-reload
systemctl enable kayanet-translate.service >/dev/null
systemctl restart kayanet-translate.service
rm -rf "$TMP"

# Tarayıcı için nginx köprüsü: /kn-translate -> 127.0.0.1:8082/translate (servis dışarıya açılmaz, yalnızca bu yol)
IIAB_CONF=$(grep -rlE 'location[[:space:]]+/admin[[:space:]]*\{' /etc/nginx 2>/dev/null | head -1 || true)
if [ -n "$IIAB_CONF" ]; then
  cat > "$(dirname "$IIAB_CONF")/kayanet-translate.conf" <<'EOF'
location = /kn-translate {
    limit_except POST { deny all; }
    client_max_body_size 64k;
    proxy_pass http://127.0.0.1:8082/translate;
    proxy_read_timeout 120s;
}
EOF
  nginx -t && systemctl reload nginx
fi
sleep 8
curl -s -X POST 127.0.0.1:8082/translate -d '{"q":"Merhaba dünya","source":"tr","target":"en"}'; echo
echo "Bitti / done. Durum / status: systemctl status kayanet-translate"
