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
[ -n "$LINK" ] && [ -d "$(dirname "$LINK")" ] && ln -sfn "$OUT" "$LINK" && ln -sfn "$OUT_DIR/devices.json" "$(dirname "$LINK")/devices.json"

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

  # Bağlı / bilinen cihazlar -> devices.json (Wi-Fi istasyonları + DHCP kiraları + komşu tablosu)
  # Connected / known devices -> devices.json (Wi-Fi stations + DHCP leases + neighbour table)
  {
    now=$(date +%s)
    active=""; [ -n "$ap" ] && active=$(iw dev "$ap" station dump 2>/dev/null | awk '/^Station/{m=$2} /signal:/{if(m){print m, $2; m=""}}')
    leases=""; for lf in /var/lib/misc/dnsmasq.leases /var/lib/NetworkManager/dnsmasq-*.leases; do [ -r "$lf" ] && leases+="$(cat "$lf")"$'\n'; done
    neigh=$(ip -4 neigh show 2>/dev/null | awk '$4=="lladdr"{print $5, $1, $NF}')
    {
      echo "@ACTIVE"; echo "$active"
      echo "@LEASE"; echo "$leases"
      echo "@NEIGH"; echo "$neigh"
    } | awk -v now="$now" '
      /^@/ {sec=$1; next}
      NF==0 {next}
      sec=="@ACTIVE" {m=tolower($1); on[m]=1; sig[m]=$2; seen[m]=1}
      sec=="@LEASE"  {m=tolower($2); ip[m]=$3; nm[m]=($4=="*"?"":$4); seen[m]=1}
      sec=="@NEIGH"  {m=tolower($1); if(!(m in ip)) ip[m]=$2; if($3=="REACHABLE"||$3=="DELAY"||$3=="PROBE") on[m]=1; if(m in on || m in ip) seen[m]=1}
      END{
        printf "{\"ts\":%s,\"devices\":[", now; first=1
        for (m in seen) {
          gsub(/["\\]/,"",nm[m])
          printf "%s{\"mac\":\"%s\",\"ip\":\"%s\",\"name\":\"%s\",\"online\":%s,\"signal\":%s}", (first?"":","), m, ip[m], nm[m], (on[m]?"true":"false"), (sig[m]==""?"null":sig[m]); first=0
        }
        print "]}"
      }' > "$OUT_DIR/devices.json.tmp" 2>/dev/null
    chmod 644 "$OUT_DIR/devices.json.tmp"; mv "$OUT_DIR/devices.json.tmp" "$OUT_DIR/devices.json"
  } || true

  printf '{"ts":%s,"model":"%s","cpu":%s,"cores":%s,"freq":%s,"load":%s,"temp":%s,"uptime":%s,"mem":{"total":%s,"avail":%s},"swap":{"total":%s,"free":%s},"disks":[%s],"throttled":%s,"clients":%s}\n' \
    "$(date +%s)" "${model//\"/}" "$cpu" "$cores" "$freq" "$load" "$temp" "$up" "$mt" "$ma" "$st" "$sf" "$disks" "$thr" "$clients" > "$OUT.tmp"
  chmod 644 "$OUT.tmp"; mv "$OUT.tmp" "$OUT"
  [ -n "${ONCE:-}" ] && exit 0
  sleep 5
done
