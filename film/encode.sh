#!/usr/bin/env bash
# Final delivery (50 s, 1920x1080, 60 fps).
#   1. python3 audio/remix.py   -> $SCRATCH/audio/mix_raw.wav (or audio/mix.py, if you have the sound library)
#   2. ./encode.sh [out.mp4]    -> renders and encodes in one pass. Every frame is rendered at 2x (3840x2160) and
#      downsampled. Sub-frame motion blur (up to 8 samples: a 126-degree shutter in the product section, 180 degrees
#      in v1's scenes) is averaged in float, then converted to BT.709 4:2:0 with error-diffusion dither and encoded
#      with x264 at CRF 13.
set -euo pipefail
cd "$(dirname "$0")"
REPO=$(cd .. && pwd)
export SCRATCH=${SCRATCH:-$REPO/build}
OUT=${1:-$REPO/out/heyden-launch-film-v3.mp4}
mkdir -p "$(dirname "$OUT")"
node render.mjs rough --final --ss 2 --maxsub 8 --shutter 0.35 --workers "${WORKERS:-8}" \
  --audio "$SCRATCH/audio/mix_raw.wav" --out "$OUT"
echo "$OUT"
