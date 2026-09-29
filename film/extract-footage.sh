#!/usr/bin/env bash
# Extract the footage frames the film uses into $SCRATCH/footage/<shot>/NNNN.jpg (default build/footage). Run once
# after cloning; the renderer reads the frames from there. The source is Heyden's homepage loop, which isn't stored in
# this repo: the script downloads it from heyden.ai (about 33 MB) unless $FOOTAGE_SRC points at a local copy. Each shot
# is an exact run of source frames (first frame, count), matched to the frames v1 used.
set -euo pipefail
cd "$(dirname "$0")/.."
BUILD="${SCRATCH:-$(pwd)/build}"
OUT="$BUILD/footage"
SRC="${FOOTAGE_SRC:-$BUILD/heyden-landing.mp4}"

if [ ! -f "$SRC" ]; then
  mkdir -p "$(dirname "$SRC")"
  echo "Downloading https://heyden.ai/heyden-landing.mp4 (about 33 MB)"
  curl -fL --proto '=https' -o "$SRC" https://heyden.ai/heyden-landing.mp4
fi

for spec in fire:15:90 flood:240:75 hose:369:75 heli:563:76 smoke:734:76 crop:908:76 crews:1085:120; do
  IFS=: read -r name start count <<< "$spec"
  mkdir -p "$OUT/$name"
  ffmpeg -v error -y -i "$SRC" -vf "select='between(n\,$start\,$((start + count - 1)))'" -fps_mode passthrough \
    -q:v 1 -start_number 0 "$OUT/$name/%04d.jpg"
  echo "$name: $(ls "$OUT/$name" | wc -l | tr -d ' ') frames"
done
