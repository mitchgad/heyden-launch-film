"""Get the soundtrack ready for a render, without the sound library.

The sound effects were drawn from a licensed library that can only be shared as part of the finished film, so this
repo has no separate effects track. By default this script takes the soundtrack from the delivered film, so a
re-render keeps the approved sound exactly. With --score it re-renders the music from `score.py` through the same music
chain as `mix.py` (ducking, lifts, fades and level), with no sound effects: use that to hear a music change, then add
the effects back before the film goes out.

    python3 audio/remix.py            ->  $SCRATCH/audio/mix_raw.wav, the delivered soundtrack
    python3 audio/remix.py --score    ->  the same path, music only, re-rendered from score.py
"""
import argparse
import json
import os
import subprocess

import numpy as np
import soundfile as sf
from dsp import SCRATCH, SR, db, duck_curve, limiter, lufs, true_peak

HERE = os.path.dirname(os.path.abspath(__file__))
FILM = os.path.abspath(os.path.join(HERE, '..', '..', 'out', 'heyden-launch-film-v3.mp4'))
DUR = 50.0
N = int(SR * DUR)


def gain_curve(points):
    ts = np.array([p[0] for p in points])
    gs = np.array([p[1] for p in points])
    return db(np.interp(np.arange(N) / SR, ts, gs))[:, None]


def music_from_score():
    """score.py through mix.py's music chain; keep the curves below in step with mix.py"""
    import score
    TL = json.load(open(os.path.join(HERE, 'motion.json')))['TL']
    raw = score.render()[0] * db(-17.0)
    music_duck = gain_curve([
        (0, 0), (5.9, 0), (5.93, -40), (6.0, -40), (6.01, -6), (6.6, 0),
        (45.72, 0), (45.9, -14), (45.99, -30), (46.01, -5), (46.7, 0), (50, 0),
    ])
    lift_music = gain_curve([(0, 3.0), (5.9, 3.0), (6.0, 2.5), (7.0, 2.5), (7.9, 0), (8.3, -2.0), (41.7, -2.0),
                             (42.2, 0), (45.95, 0), (46.0, 2.5), (48.5, 2.5), (50, 2.5)])
    clicks = [TL[k] for k in ('invite', 'nav1', 'focusIn', 'plus', 'assess', 'nav2', 'align', 'pick', 'nav3',
                              'searchClick', 'ask')]
    click_duck = duck_curve(N, clicks, depth_db=2.5, attack=0.01, hold=0.06, release=0.25)[:, None]
    fadeout = gain_curve([(0, -2.5), (7.9, -2.5), (8.1, 0), (41.9, 0), (42.1, -2.0), (49.1, -2.0), (50.0, -32)])
    gain = json.load(open(os.path.join(HERE, 'stems', 'levels.json')))['music_gain_db']
    return raw * music_duck * lift_music * click_duck * fadeout * db(gain)


def main():
    ap = argparse.ArgumentParser(description='Get the soundtrack ready for a render.')
    ap.add_argument('--score', action='store_true', help='re-render the music from score.py (music only, no effects)')
    args = ap.parse_args()

    out = os.path.join(SCRATCH, 'audio')
    os.makedirs(out, exist_ok=True)
    path = os.path.join(out, 'mix_raw.wav')
    if args.score:
        music = music_from_score()
        for _ in range(4):  # land at -14 LUFS after the limiter, as mix.py does
            music = music * db(-14.0 - lufs(limiter(music, -1.6)))
        mix = limiter(music, -1.6)
        sf.write(path, mix.astype(np.float32), SR, subtype='FLOAT')
        print('Music only: the sound effects are not in this mix. Add them back before the film goes out.')
    else:
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', FILM, '-vn', '-ac', '2', '-ar', str(SR),
                        '-c:a', 'pcm_f32le', path], check=True)
        mix, _ = sf.read(path, dtype='float64')
    print(f'{path}: {lufs(mix):.1f} LUFS, true peak {20 * np.log10(true_peak(mix)):.2f} dBTP')


if __name__ == '__main__':
    main()
