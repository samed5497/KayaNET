#!/usr/bin/env bash
# Kiwix içerik sayfalarına KayaNET üst şeridi + "Sayfayı çevir" ekler (nginx sub_filter; Kiwix/IIAB dosyalarına dokunmaz).
# Adds the KayaNET header and "Translate page" button to Kiwix content pages. --remove geri alır / undoes.
set -euo pipefail
[ "$EUID" -eq 0 ] || { echo "sudo ile çalıştır / run with sudo" >&2; exit 1; }
IIAB_CONF=$(grep -rlE 'location[[:space:]]+/admin[[:space:]]*\{' /etc/nginx 2>/dev/null | head -1 || true)
[ -n "$IIAB_CONF" ] || { echo "IIAB nginx ayarı bulunamadı" >&2; exit 1; }
CONF="$(dirname "$IIAB_CONF")/kayanet-kiwix.conf"
[ "${1:-}" = "--remove" ] && { rm -f "$CONF"; nginx -t && systemctl reload nginx; echo "kaldırıldı / removed"; exit 0; }
# Mevcut Kiwix proxy hedefini bul / find the existing Kiwix upstream
UP=$(grep -rhE 'proxy_pass[[:space:]]+http://(127\.0\.0\.1|localhost):[0-9]+' $(grep -rlE 'location[[:space:]]+(\^~[[:space:]]+)?/kiwix' /etc/nginx | grep -v kayanet-kiwix) 2>/dev/null | head -1 | sed -E 's/.*proxy_pass[[:space:]]+(http:\/\/[^;\/]+).*/\1/')
[ -n "$UP" ] || { echo "Kiwix proxy hedefi bulunamadı / Kiwix upstream not found" >&2; exit 1; }
cat > "$CONF" <<EOF
# KayaNET Kiwix üst şeridi (scripts/install-kiwix-overlay.sh)
location ^~ /kiwix/content/ {
    proxy_pass $UP;
    proxy_set_header Host \$host;
    proxy_set_header Accept-Encoding "";
    sub_filter_types text/html;
    sub_filter_once on;
    sub_filter '</body>' '<script src="/home/kn-kiwix.js"></script></body>';
}
# Arama sonuçları / search results
location ^~ /kiwix/search {
    proxy_pass $UP;
    proxy_set_header Host \$host;
    proxy_set_header Accept-Encoding "";
    sub_filter_types text/html;
    sub_filter_once on;
    sub_filter '</body>' '<script src="/home/kn-kiwix.js"></script></body>';
}
# Kütüphane ana sayfası (kitap kartları) / library home page
location = /kiwix/ {
    proxy_pass $UP;
    proxy_set_header Host \$host;
    proxy_set_header Accept-Encoding "";
    sub_filter_types text/html;
    sub_filter_once on;
    sub_filter '</body>' '<script src="/home/kn-kiwix.js"></script></body>';
}
EOF
if ! nginx -t 2>/tmp/kn-nginx.err; then cat /tmp/kn-nginx.err >&2; rm -f "$CONF"; echo "geçersiz, geri alındı" >&2; exit 1; fi
systemctl reload nginx
echo "Kiwix üst şeridi kuruldu / installed (upstream $UP)"
