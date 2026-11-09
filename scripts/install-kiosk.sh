#!/usr/bin/env bash
# HMI / ekran modu: Pi açılınca HDMI ekranda tam ekran KayaNET (fare ve klavye çalışır).
# HMI / display mode: boots straight into a fullscreen KayaNET on the HDMI screen (mouse and keyboard work).
# Ekran takılıyken çalıştır / run with a display attached.  Geri almak / undo:  sudo scripts/install-kiosk.sh --remove
set -euo pipefail
[ "$EUID" -eq 0 ] || { echo "sudo ile çalıştır / run with sudo" >&2; exit 1; }
USER_NAME="${SUDO_USER:-kaya}"
URL="${KIOSK_URL:-http://localhost/home/}"

if [ "${1:-}" = "--remove" ]; then
  systemctl disable --now kayanet-kiosk.service 2>/dev/null || true
  rm -f /etc/systemd/system/kayanet-kiosk.service; systemctl daemon-reload
  systemctl enable --now getty@tty1.service 2>/dev/null || true
  echo "Kiosk kaldırıldı / kiosk removed"; exit 0
fi

avail_mb=$(df -BM --output=avail / | tail -1 | tr -dc 0-9)
[ "$avail_mb" -ge 1500 ] || { echo "Yetersiz boş alan / not enough free space: ${avail_mb} MB (en az 1500)" >&2; exit 1; }
mem_mb=$(awk '/^MemTotal/{print int($2/1024)}' /proc/meminfo)
[ "$mem_mb" -ge 1500 ] || echo "Uyarı / warning: ${mem_mb} MB RAM az; tarayıcı yapay zekayla birlikte yavaşlayabilir / low RAM"

apt-get update -qq
apt-get install -y -qq cage chromium seatd fonts-noto-color-emoji >/dev/null
usermod -aG video,input,render,seat "$USER_NAME" 2>/dev/null || usermod -aG video,input,render "$USER_NAME"
systemctl enable --now seatd.service >/dev/null 2>&1 || true

cat > /etc/systemd/system/kayanet-kiosk.service <<EOF
[Unit]
Description=KayaNET HMI (tam ekran tarayıcı / fullscreen browser)
After=systemd-user-sessions.service nginx.service getty@tty1.service
Conflicts=getty@tty1.service

[Service]
User=$USER_NAME
PAMName=login
TTYPath=/dev/tty1
StandardInput=tty
StandardOutput=journal
Environment=XDG_RUNTIME_DIR=/run/user/%U
Environment=WLR_LIBINPUT_NO_DEVICES=1
ExecStartPre=/bin/sleep 5
ExecStart=/usr/bin/cage -s -- /usr/bin/chromium --kiosk --noerrdialogs --disable-infobars --no-first-run --disable-features=TranslateUI --password-store=basic $URL
Restart=always
RestartSec=5

[Install]
WantedBy=graphical.target
EOF
systemctl daemon-reload
systemctl set-default graphical.target >/dev/null 2>&1 || true
systemctl enable kayanet-kiosk.service >/dev/null
echo "Kiosk kuruldu / kiosk installed. Yeniden başlat / reboot: sudo reboot"
echo "Geri almak / undo: sudo scripts/install-kiosk.sh --remove"
