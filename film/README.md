# The film's source

Source for `../out/heyden-launch-film-v3.mp4` (50 s, 1920×1080, 60 fps). The film is an HTML page where every frame is
a pure function of time, captured frame by frame in headless Chromium, with sub-frame motion blur. No animation
libraries.

## Structure

| Time | Scene | File |
|---|---|---|
| 0.0–8.0 | The intro, the three problems and the logo reveal | `scenes/intro.js` |
| 7.86–42.0 | The product section: one Heyden app used live | `scenes/product.js`, `platform.js`, `platform.css` |
| 42.0–50.0 | The roles, "Ideas to Outcomes" and the lockup | `scenes/outro.js` (placed on the timeline in `film.js`) |

The product section has four chapters, then the globe:
1. **Collaborate** (Projects): invite the team, a partner agency joins, and their shared project arrives.
2. **Innovate** (Quick Assessment): the proposal, Assess, and the TRL/IRL/ORL brief.
3. **Strategise** (Strategy Hub): align a project to a critical gap, and coverage moves.
4. **Solve** (Commons): Ask Heyden's curated view.

The globe closes the section with "A Global Innovation Hub for Emergency Services." The same line also sits under the
logo in the intro: the intro's copy is in `scenes/intro.js`, the globe's in `WORLD_LINES` in `scenes/product.js`.
Event times live in `TL` at the top of `scenes/product.js`; the camera shots, cursor paths and sound are all placed
relative to it.

Every label comes from `../brand`: the site's copy, the product screenshots and the product's stylesheet. The demo data
follows the screenshots' workspace, with generic organisation names.

## Camera

- **Titles** use authored 3D poses (`CAM3D`).
- **Shot list:** while the app is being used, the camera follows a directed shot list (`SHOTS`). It frames the area
  where the next thing happens, holds still while the cursor clicks and the result appears, then makes one eased move
  to the next area.
- **Sharp holds:** holds render without motion blur, so the UI stays sharp and readable.
- **Clean numbers:** discrete UI state (counters, typed characters, switches) reads the frame's own time, so
  motion-blur samples never print two digits on top of each other.
- **Cursor:** it moves with a quick start, a soft landing and a slight arc, rests on what it clicks, and steps out of
  the way while text is typed.

## Commands

Run these from this folder. Rendered files go to `../build/` (or `$SCRATCH`).

```sh
node render.mjs stills 2,10,21.5                                  # PNG stills, no motion blur
node render.mjs sheet 8:42:0.25                                   # contact sheet
node render.mjs design projects,qa,strategy,commons --scale 2     # flat renders of the platform pages
node render.mjs geo                                               # UI geometry in window space, for authoring shots
node render.mjs motion                                            # camera + cursor motion -> audio/motion.json
python3 audio/remix.py                                            # soundtrack -> ../build/audio/mix_raw.wav
node render.mjs rough --workers 8 --audio ../build/audio/mix_raw.wav --out ../build/rough.mp4   # quick preview
./encode.sh                                                       # the final -> ../out/heyden-launch-film-v3.mp4
```

`extract-footage.sh` (run once) downloads Heyden's homepage loop from heyden.ai and pulls out the footage frames the
intro and outro use.

The final (`encode.sh`) renders every frame at 2× (3840×2160, including the 3D layers) and downsamples it to 1080p.
It averages up to 8 motion-blur samples per frame in float, then converts to BT.709 4:2:0 with error-diffusion dither
and encodes with x264 at CRF 13. The shutter is 126° in the product section and 180° elsewhere.

## Sound

- **Music (`audio/score.py`):** written and synthesised for the film, with no samples. It's a restrained, groovy
  120 BPM track on the film's own grid, in A♭ major on a vi–IV–I–V loop (Fm9, D♭maj9, A♭maj9, E♭6/9).
  - **Instruments:** a tuned kick, a layered clap, hats and cymbals, a pluck bass, an FM electric piano, a detuned-saw
    pad, a plucked arpeggio through a ping-pong delay, and noise risers.
  - **Arrangement:** a muffled kick on every intro cut, a build into the logo, and the groove dropping at 8 s. Each
    chapter adds a layer. It breaks down for the Strategise title and the globe, then resolves onto the logo.
- **Sound effects:** soft UI sounds, one per action, panned to where the cursor is, with whooshes only on real
  camera moves. They were drawn from a licensed sound library whose licence only allows them as part of the finished
  film, so they exist only in the delivered film's soundtrack. `audio/mix.py` shows how they were placed; it only
  runs with that library.
- **Master:** the music dips 2.5 dB under each click. The soundtrack is −14 LUFS integrated, with true peaks at
  −1.6 dBTP before AAC encoding.

### The soundtrack for a render

- `python3 audio/remix.py` takes the soundtrack from the delivered film, so a re-render keeps the approved sound.
- After editing `score.py`, `python3 audio/remix.py --score` re-renders the music through the same chain, without the
  sound effects. The effects then need redoing before the film goes out.

The picture doesn't depend on the sound. After a sound change, remux the existing video with the new
`../build/audio/mix_raw.wav` instead of re-rendering.

`audio/dsp.py` holds the oscillators, filters, reverb, loudness meter and limiter.
