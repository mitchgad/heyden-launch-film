# Heyden launch film

A 50-second launch film for [Heyden](https://heyden.ai), with everything needed to edit and re-render it.

The quickest start: open this folder in Claude Code and ask "how do I use this?" or describe the edit you want. It
knows the steps below and the rules for this film.

| Folder | What's in it |
|---|---|
| `out/` | The film: `heyden-launch-film-v3.mp4`, 1920×1080 at 60 fps, H.264 with AAC |
| `storyboard/` | The storyboard and the four designed platform pages |
| `film/` | The source. Every frame is drawn by code in a browser and captured one by one: no video editor, no animation libraries |
| `brand/` | The brand kit the film draws on: site copy, product screenshots, logo and fonts |

## Set up (once)

You need Node 20 or later, ffmpeg and Python 3.

```bash
npm install
npx playwright install chromium
python3 -m pip install -r requirements.txt
film/extract-footage.sh
```

The last step downloads the homepage footage from heyden.ai (about 33 MB) and pulls out the frames the film uses.
The footage itself isn't stored in this repo.

## Re-render the film

```bash
python3 film/audio/remix.py
film/encode.sh
```

The first command takes the soundtrack from the delivered film. The second renders the film to
`out/heyden-launch-film-v3.mp4`, which took about 40 minutes on the Mac it was made on. For quick checks, render
single frames with `node film/render.mjs stills 10,21.5`; `film/README.md` lists the other commands. To keep the
delivered file, render to a new name: `film/encode.sh out/<new-name>.mp4`.

## Making edits

- **By hand:** the scenes are in `film/scenes/`, and the platform's pages are in `film/platform.js` and
  `film/platform.css`. The product section's timings are in `TL` at the top of `film/scenes/product.js`.
  `film/README.md` explains how it fits together.
- **With Claude Code:** open this folder in Claude Code and describe the change. `CLAUDE.md` gives it the rules for
  this film.
- **Keep the timing where you can.** The soundtrack, sound effects included, is fixed to the current picture (see
  Sound).

## Sound

- **Music:** original, synthesised in `film/audio/score.py`, with the rendered music track in `film/audio/stems/`.
- **Sound effects:** drawn from a licensed sound library whose licence only allows them as part of the finished film.
  They aren't in this repo on their own: they exist only in the delivered film's soundtrack.
- **What that means for edits:**
  - Picture changes that keep the timing re-render with the delivered soundtrack as it is.
  - A change that moves the timing, or a change to the music, means the sound effects need redoing.
  - `python3 film/audio/remix.py --score` re-renders the music after an edit to `score.py`, without effects, so you
    can hear the change.
- **Sound only:** to swap a new soundtrack into the existing picture without re-rendering:

  ```bash
  ffmpeg -i out/heyden-launch-film-v3.mp4 -i build/audio/mix_raw.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 320k out/new.mp4
  ```

## Credits and licences

- **Font:** Inter, under the SIL Open Font License (`brand/fonts/`).
- **Footage:** Heyden's homepage loop, downloaded from heyden.ai at setup. It looks like licensed stock; confirm the
  licence covers this film before it's posted.
- **Sound effects:** Ocular Sounds, used under their licence as part of the finished film.
- **Globe:** the land outline is Natural Earth's public-domain data in world-atlas's TopoJSON, read with
  topojson-client (ISC licence).
- **Everything else:** the code, the platform designs and the music were made for this film.
