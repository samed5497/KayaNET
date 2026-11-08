#!/usr/bin/env bash
# Yerel yapay zeka asistanını kurur: llama.cpp (llama-server) + Qwen3 modeli + "Sor" servisi.
# Installs the local AI assistant: llama.cpp (llama-server) + a Qwen3 model + the "Ask" service.
# Tekrar çalıştırmak güvenlidir / safe to re-run.
#
# Kullanım / usage:  sudo ./scripts/install-ai.sh [qwen3-0.6b|qwen3-1.7b|qwen3-4b]     (varsayılan / default: RAM'e göre / by RAM)
# Ortam / env:  MODEL_URL=<gguf adresi>  (listedekini geçersiz kılar / overrides the list)
set -euo pipefail
REPO="$(cd "$(dirname "$0")/.." && pwd)"
[ "$EUID" -eq 0 ] || { echo "sudo ile çalıştır / run with sudo" >&2; exit 1; }
AI=/opt/kayanet-ai; mkdir -p "$AI/models"

mem_mb=$(awk '/^MemTotal/{print int($2/1024)}' /proc/meminfo)
pick="${1:-}"
if [ -z "$pick" ]; then
  if   [ "$mem_mb" -ge 7000 ]; then pick=qwen3-4b
  elif [ "$mem_mb" -ge 3500 ]; then pick=qwen3-1.7b
  else pick=qwen3-0.6b; fi
fi
case "$pick" in
  qwen3-0.6b) URL=https://huggingface.co/unsloth/Qwen3-0.6B-GGUF/resolve/main/Qwen3-0.6B-Q4_K_M.gguf;;
  qwen3-1.7b) URL=https://huggingface.co/unsloth/Qwen3-1.7B-GGUF/resolve/main/Qwen3-1.7B-Q4_K_M.gguf;;
  qwen3-4b)   URL=https://huggingface.co/unsloth/Qwen3-4B-GGUF/resolve/main/Qwen3-4B-Q4_K_M.gguf;;
  *) echo "Bilinmeyen model / unknown model: $pick" >&2; exit 1;;
esac
URL="${MODEL_URL:-$URL}"
MODEL="$AI/models/$(basename "$URL")"
echo "RAM: ${mem_mb} MB -> model: $pick ($MODEL)"

# disk kontrolü / disk check (model ~0.5-2.7 GB)
avail_mb=$(df -BM --output=avail "$AI" | tail -1 | tr -dc 0-9)
[ "$avail_mb" -ge 3500 ] || { echo "Yetersiz boş alan / not enough free space: ${avail_mb} MB (en az 3500 gerekli / need 3500)" >&2; exit 1; }

# 1. llama.cpp derle / build (Pi 4'te ~15-25 dk / min)
if [ ! -x "$AI/bin/llama-server" ]; then
  apt-get install -y -qq git cmake build-essential libcurl4-openssl-dev python3 >/dev/null
  rm -rf "$AI/src"; git clone --depth 1 https://github.com/ggml-org/llama.cpp "$AI/src"
  cmake -S "$AI/src" -B "$AI/src/build" -DCMAKE_BUILD_TYPE=Release -DGGML_NATIVE=ON -DLLAMA_CURL=OFF >/dev/null
  cmake --build "$AI/src/build" --config Release -j"$(nproc)" --target llama-server
  mkdir -p "$AI/bin"; cp "$AI/src/build/bin/llama-server" "$AI/bin/"
  find "$AI/src/build" -name '*.so*' -exec cp -a {} "$AI/bin/" \; 2>/dev/null || true
fi

# 2. model indir (yarım kalırsa devam eder) / download model (resumable)
if [ ! -s "$MODEL" ]; then
  curl -fL -C - --retry 5 -o "$MODEL.part" "$URL" || { echo "Model indirilemedi / model download failed: $URL" >&2; exit 1; }
  mv -f "$MODEL.part" "$MODEL"
fi

# 3. servisler / services
sed -e "s#@MODEL@#$MODEL#g" -e "s#@AI@#$AI#g" "$REPO/saglik/kayanet-llm.service" > /etc/systemd/system/kayanet-llm.service
sed -e "s#@REPO@#$REPO#g" "$REPO/saglik/kayanet-ask.service" > /etc/systemd/system/kayanet-ask.service
systemctl daemon-reload
systemctl enable --now kayanet-llm.service kayanet-ask.service >/dev/null
echo "Bitti / done. Sayfa: http://$(hostname -I | awk '{print $1}')/home  (Sor sekmesi / Ask tab)"
echo "Durum / status: systemctl status kayanet-llm kayanet-ask ; curl localhost:8081/status"
