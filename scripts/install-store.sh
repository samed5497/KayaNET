#!/usr/bin/env bash
# "İçerik Ekle" servisini kurar ve yönetici PIN'ini oluşturur (yoksa).
# Installs the "Add content" service and creates the admin PIN (if missing).
set -euo pipefail
[ "$EUID" -eq 0 ] || { echo "sudo ile çalıştır / run with sudo" >&2; exit 1; }
REPO="$(cd "$(dirname "$0")/.." && pwd)"
mkdir -p /etc/kayanet
if [ ! -s /etc/kayanet/pin ]; then
  printf '%06d\n' $((RANDOM*RANDOM % 1000000)) > /etc/kayanet/pin
  echo "YÖNETİCİ PIN / ADMIN PIN (İçerik Ekle sayfası için, not al / write it down): $(cat /etc/kayanet/pin)"
fi
chmod 600 /etc/kayanet/pin
chmod +x "$REPO/scripts/download-content.sh"
sed "s#@REPO@#$REPO#g" "$REPO/saglik/kayanet-store.service" > /etc/systemd/system/kayanet-store.service
systemctl daemon-reload
systemctl enable --now kayanet-store.service >/dev/null
systemctl restart kayanet-store.service
echo "İçerik servisi çalışıyor / store service running: http://$(hostname -I | awk '{print $1}')/home/icerik.html"
