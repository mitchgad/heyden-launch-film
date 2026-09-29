# Heyden launch film

The source of a 50-second launch film for Heyden. `README.md` covers setup and rendering; `film/README.md` explains
how the code fits together.

## When someone asks how to use this repo

Tell them what they can do and do the parts they want done:

- **Watch it:** the film is `out/heyden-launch-film-v3.mp4`.
- **Set up:** check for Node 20+, ffmpeg and Python 3, then run the four commands under "Set up (once)" in
  `README.md`. The Playwright step downloads Chromium and `film/extract-footage.sh` downloads the footage from
  heyden.ai (about 33 MB), so ask first.
- **Make an edit:** find the scene (the table in `film/README.md` maps times to files), make the change, render stills
  of every frame it touches and show them, then a quick preview. Render the final only once they're happy: run
  `python3 film/audio/remix.py` first, then `film/encode.sh`, which adds that soundtrack to the picture. The render
  takes about 40 minutes. Follow the rules below.
- **The repeated line:** "A Global Innovation Hub for Emergency Services" appears twice, under the logo in the intro
  (`film/scenes/intro.js`) and over the globe (`WORLD_LINES` in `film/scenes/product.js`). Ask which one they mean.
- **Change the sound:** the music is `film/audio/score.py`. `python3 film/audio/remix.py --score` re-renders it
  without the sound effects, so they can hear the change; the effects then need redoing (rule 5).
- **Make a new version:** keep the delivered file and render to a new name: `film/encode.sh out/<new-name>.mp4`.

## Rules for edits

1. **It stays a motion piece.** Motion graphics come first: big type, one idea at a time. The product is shown as the
   designed Heyden platform the camera moves through, never as screenshots or inside a static browser frame.
2. **Readable, never a slideshow.** Slow enough to read, but the motion carries the timing.
3. **Claims.** Every word on screen traces to `brand/`: the site copy, the product screenshots or the product's
   stylesheet. No invented stats, customers or real people, and the demo organisation names stay generic.
4. **Change only what's asked.** Everything else stays as it is.
5. **Timing and sound.** The sound effects come from a licensed library and exist only inside the delivered film's
   soundtrack, fixed to the current timing. Never add the library's sounds to this repo on their own. If a change
   would move anything the effects follow (clicks, camera moves, titles), or change the music, say so before making
   it: the effects will need redoing.
6. **Custom motion.** Every move is written in the film's own code: no Remotion or animation libraries.

## Checking a change

- `node film/render.mjs stills <times>` renders single frames; look at every scene the change touches.
- `node film/render.mjs rough --workers 8 --out build/rough.mp4` makes a quick preview at real speed.
- `film/encode.sh` renders the final.
- `python3 film/audio/remix.py` takes the soundtrack from the delivered film; run it before `film/encode.sh`.
