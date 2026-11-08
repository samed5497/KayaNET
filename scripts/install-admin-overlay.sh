#!/usr/bin/env bash
# IIAB Admin Console (/admin) için KayaNET katmanı: TR/EN dil seçici, modern tema, bağlı cihazlar, açıklamalar.
# IIAB dosyalarına DOKUNMAZ: nginx sub_filter ile /admin sayfasına bir CSS ve iki JS ekler.
# IIAB güncellense bile bozulmaz (ayrı bir nginx dosyası). Geri almak için: sudo scripts/install-admin-overlay.sh --remove
# KayaNET overlay for the IIAB Admin Console: TR/EN switch, modern theme, connected devices, explanations.
# Touches no IIAB file: nginx sub_filter injects one CSS + two JS files. Survives IIAB upgrades. Undo: --remove
set -euo pipefail

[ "$EUID" -eq 0 ] || { echo "sudo ile çalıştır / run with sudo" >&2; exit 1; }
REPO="$(cd "$(dirname "$0")/.." && pwd)"
DST=/library/www/html/home
CONF_NAME=kayanet-admin.conf

# IIAB'nin admin nginx dosyasını bul (aynı klasöre yazacağız)
IIAB_CONF=$(grep -rlE 'location[[:space:]]+/admin[[:space:]]*\{' /etc/nginx 2>/dev/null | grep -v "$CONF_NAME" | head -1 || true)
[ -n "$IIAB_CONF" ] || { echo "IIAB admin nginx ayarı bulunamadı / IIAB admin nginx config not found" >&2; exit 1; }
CONF_DIR=$(dirname "$IIAB_CONF")

if [ "${1:-}" = "--remove" ]; then
  rm -f "$CONF_DIR/$CONF_NAME"
  nginx -t && systemctl reload nginx
  echo "Katman kaldırıldı / overlay removed"; exit 0
fi

ADMIN_DIR=$(awk '/location[ \t]+\/admin[ \t]*\{/{f=1} f&&/alias/{gsub(";","",$2); print $2; exit}' "$IIAB_CONF")
[ -f "$ADMIN_DIR/index.html" ] || { echo "Admin klasörü bulunamadı / admin dir not found: $ADMIN_DIR" >&2; exit 1; }
[ -d "$DST" ] || { echo "$DST yok. Önce install-homepage.sh çalıştır / run install-homepage.sh first" >&2; exit 1; }

# Dosyalar ana sayfa klasöründen sunulur (/home/...)
mkdir -p "$DST/i18n"
cp "$REPO/www/home/kn-i18n.js" "$REPO/www/admin/kn-admin.js" "$REPO/www/admin/kn-admin.css" "$DST/"
cp "$REPO/www/admin/admin-tr.json" "$DST/i18n/"

INJECT='<link rel="stylesheet" href="/home/kn-admin.css"><script src="/home/kn-i18n.js"></script><script src="/home/kn-admin.js"></script></body>'
cat > "$CONF_DIR/$CONF_NAME" <<EOF
# KayaNET: /admin sayfasına dil katmanını ekler (IIAB dosyaları değişmez)
location = /admin/ {
    alias $ADMIN_DIR/index.html;
    sub_filter '</body>' '$INJECT';
    sub_filter_once on;
    sub_filter_types text/html;
}
location = /admin/index.html {
    alias $ADMIN_DIR/index.html;
    sub_filter '</body>' '$INJECT';
    sub_filter_once on;
    sub_filter_types text/html;
}
EOF

if ! nginx -t 2>/tmp/kn-nginx.err; then
  cat /tmp/kn-nginx.err >&2; rm -f "$CONF_DIR/$CONF_NAME"
  echo "nginx ayarı geçersiz, katman geri alındı / nginx config invalid, overlay reverted" >&2; exit 1
fi
systemctl reload nginx
echo "Admin katmanı kuruldu / admin overlay installed: http://box.lan/admin (Ctrl+F5 ile yenile)"

# Güvenlik: bilinen varsayılan parolalı kullanıcılar / known default-password users
for u in iiab-admin pi; do
  id "$u" >/dev/null 2>&1 && echo "UYARI / WARNING: '$u' kullanıcısı var; varsayılan parolası herkesçe biliniyor. Değiştir: sudo passwd $u  (ya da kilitle: sudo passwd -l $u)"
done
