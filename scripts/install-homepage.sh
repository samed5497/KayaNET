#!/usr/bin/env bash
# KayaNET Prepper Disk ana sayfasını Internet-in-a-Box'a kurar (eskisinin yedeğini alır).
# Installs the KayaNET Prepper Disk homepage into Internet-in-a-Box (backs up the old one).
set -euo pipefail

[ "$EUID" -eq 0 ] || { echo "sudo ile çalıştır / run with sudo" >&2; exit 1; }
SRC="$(cd "$(dirname "$0")/.." && pwd)/www/home"
DST=/library/www/html/home

[ -d "$DST" ] || { echo "$DST yok. Önce Internet-in-a-Box'ı kur / install Internet-in-a-Box first" >&2; exit 1; }

if [ -f "$DST/index.html" ] && [ ! -f "$DST/index.html.iiab-original" ]; then
  cp "$DST/index.html" "$DST/index.html.iiab-original"
fi
cp "$SRC/index.html" "$SRC/acil.html" "$DST/"
mkdir -p "$DST/i18n"
cp "$SRC/kn-i18n.js" "$SRC/kn-bar.js" "$SRC/cats.js" "$SRC/icerik.html" "$SRC/ayarlar.html" "$DST/"
cp "$SRC"/i18n/*.json "$DST/i18n/"
echo "Ana sayfa kuruldu / homepage installed: http://box.lan/home"
echo "Geri almak için / to restore: sudo cp $DST/index.html.iiab-original $DST/index.html"

# Sistem bilgisi servisi (RAM, CPU, sıcaklık) / system stats service
REPO="$(cd "$(dirname "$0")/.." && pwd)"
sed "s#@REPO@#$REPO#g" "$REPO/saglik/has-stats.service" > /etc/systemd/system/has-stats.service
systemctl daemon-reload
systemctl enable --now has-stats.service >/dev/null
echo "Sistem bilgisi servisi çalışıyor / stats service running: has-stats.service"

# İçerik Ekle servisi + PIN / content store service + PIN
"$REPO/scripts/install-store.sh"
"$REPO/scripts/install-bridges.sh"
