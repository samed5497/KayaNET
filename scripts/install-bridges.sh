#!/usr/bin/env bash
# Tarayıcı için nginx köprüleri: /kn-store/ -> 127.0.0.1:8084 (içerik servisi), /kn-ask/ -> 127.0.0.1:8081 (yapay zeka).
# Pi güvenlik duvarı LAN'dan yalnızca 80/22 gibi portları açar; servisler bu yüzden 80 üzerinden köprülenir.
# nginx bridges for the browser: the Pi firewall only opens 80/22 etc. from the LAN, so services are proxied via port 80.
set -euo pipefail
[ "$EUID" -eq 0 ] || { echo "sudo ile çalıştır / run with sudo" >&2; exit 1; }
IIAB_CONF=$(grep -rlE 'location[[:space:]]+/admin[[:space:]]*\{' /etc/nginx 2>/dev/null | head -1 || true)
[ -n "$IIAB_CONF" ] || { echo "IIAB nginx ayarı bulunamadı / IIAB nginx config not found" >&2; exit 1; }
CONF="$(dirname "$IIAB_CONF")/kayanet-bridges.conf"
cat > "$CONF" <<'EOF'
# KayaNET köprüleri (scripts/install-bridges.sh)
location /kn-store/ {
    proxy_pass http://127.0.0.1:8084/;
    proxy_read_timeout 300s;
    client_max_body_size 64k;
}
location /kn-ask/ {
    proxy_pass http://127.0.0.1:8081/;
    proxy_http_version 1.1;
    proxy_buffering off;          # akış (SSE) için / for streaming answers
    proxy_read_timeout 600s;
    client_max_body_size 64k;
}
EOF
if ! nginx -t 2>/tmp/kn-nginx.err; then cat /tmp/kn-nginx.err >&2; rm -f "$CONF"; echo "nginx ayarı geçersiz, geri alındı / invalid, reverted" >&2; exit 1; fi
systemctl reload nginx
echo "Köprüler kuruldu / bridges installed: /kn-store/ /kn-ask/"
