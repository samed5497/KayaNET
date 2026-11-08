#!/usr/bin/env bash
# Sistem bilgisini (RAM, CPU, sıcaklık, disk, güç) her 5 sn'de bir stats.json'a yazar; ana sayfa okur.
# Writes system stats (RAM, CPU, temp, disk, power) to stats.json every 5 s; the homepage reads it.
# JSON /run altında (RAM'de) tutulur, SD karta yazılmaz / kept in /run (RAM), no SD wear.
# Ortam / environment:  OUT_DIR=/run/has-stats  LINK=/library/www/html/home/stats.json  ONCE=1 (tek sefer / once)
set -uo pipefail
OUT_DIR="${OUT_DIR:-/run/has-stats}"
LINK="${LINK:-/library/www/html/home/stats.json}"
LIB="${LIB:-/library}"
mkdir -p "$OUT_DIR"; chmod 755 "$OUT_DIR"
OUT="$OUT_DIR/stats.json"
[ -n "$LINK" ] && [ -d "$(dirname "$LINK")" ] && ln -sfn "$OUT" "$LINK"

model=$( [ -r /proc/device-tree/model ] && tr -d '\0' </proc/device-tree/model || echo Linux )
read -r _ pu pn ps pi pw pq pz _ </proc/stat; pt=$((pu+pn+ps+pi+pw+pq+pz)); pidle=$((pi+pw))

while :; do
  read -r _ u n s i w q z _ </proc/stat; t=$((u+n+s+i+w+q+z)); idle=$((i+w))
  dt=$((t-pt)); cpu=0; [ "$dt" -gt 0 ] && cpu=$(( 100*(dt-(idle-pidle))/dt )); pt=$t; pidle=$idle

  mt=$(awk '/^MemTotal/{print int($2/1024)}' /proc/meminfo)
  ma=$(awk '/^MemAvailable/{print int($2/1024)}' /proc/meminfo)
  st=$(awk '/^SwapTotal/{print int($2/1024)}' /proc/meminfo)
  sf=$(awk '/^SwapFree/{print int($2/1024)}' /proc/meminfo)
  temp=null; [ -r /sys/class/thermal/thermal_zone0/temp ] && temp=$(awk '{printf "%.1f",$1/1000}' /sys/class/thermal/thermal_zone0/temp)
  load=$(cut -d' ' -f1 /proc/loadavg); up=$(cut -d. -f1 /proc/uptime)
  cores=$(nproc)
  freq=null; [ -r /sys/devices/system/cpu/cpu0/cpufreq/scaling_cur_freq ] && freq=$(( $(cat /sys/devices/system/cpu/cpu0/cpufreq/scaling_cur_freq)/1000 ))

  disks=""
  for mp in / "$LIB"; do
    mountpoint -q "$mp" || continue
    [ "$mp" = "$LIB" ] && [ "$(stat -c %d /)" = "$(stat -c %d "$LIB")" ] && continue
    d=$(df -B1M --output=size,used "$mp" | tail -1)
    disks+="${disks:+,}{\"mount\":\"$mp\",\"total\":$(awk '{print $1}' <<<"$d"),\"used\":$(awk '{print $2}' <<<"$d")}"
  done

  thr=null
  if command -v vcgencmd >/dev/null 2>&1; then
    v=$(vcgencmd get_throttled 2>/dev/null | cut -d= -f2); [ -n "$v" ] && thr=$((v))
  fi
  clients=null
  ap=$(iw dev 2>/dev/null | awk '$1=="Interface"{i=$2} $1=="type" && $2=="AP"{print i; exit}')
  [ -n "$ap" ] && clients=$(iw dev "$ap" station dump 2>/dev/null | grep -c '^Station')

  printf '{"ts":%s,"model":"%s","cpu":%s,"cores":%s,"freq":%s,"load":%s,"temp":%s,"uptime":%s,"mem":{"total":%s,"avail":%s},"swap":{"total":%s,"free":%s},"disks":[%s],"throttled":%s,"clients":%s}\n' \
    "$(date +%s)" "${model//\"/}" "$cpu" "$cores" "$freq" "$load" "$temp" "$up" "$mt" "$ma" "$st" "$sf" "$disks" "$thr" "$clients" > "$OUT.tmp"
  chmod 644 "$OUT.tmp"; mv "$OUT.tmp" "$OUT"
  [ -n "${ONCE:-}" ] && exit 0
  sleep 5
done
