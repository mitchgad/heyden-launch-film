"""Heyden launch film v3: music + sound design, placed against the picture (50 s).

MUSIC: `score.py` — a restrained, groovy 120 BPM track written and synthesised for the film (no samples): kick, clap,
808-style hats, a pluck bass, an FM electric piano, a pad and a plucked arpeggio, in A♭ major (vi–IV–I–V), locked to
the film's grid. It drops at 8 s, breaks down for the Strategise title and the globe, and cadences onto the mark.

SOUND DESIGN: one family of soft, warm UI sounds from the library, each left at its natural tone, with a clear attack
and no low-pass. Every UI sound is high-passed above the bass so the low end stays clean. One sound per action (plus,
at most, a quiet body under the main buttons), whooshes only where the camera really moves; where the score already
hits (the intro cuts, the logo, the drops), the library impacts step back.

    python mix.py  ->  $SCRATCH/audio/mix_raw.wav (+ stems, QA plot)

This script needs the sound library the effects were drawn from, which isn't part of this repo: its licence only
allows the sounds as part of the finished film. Without it, `remix.py` takes the soundtrack from the delivered film.
"""
import os, json
import numpy as np
import soundfile as sf
from dsp import *

if not os.path.isdir(SFX):
    raise SystemExit(f"The sound library ({SFX}) isn't here, so the effects can't be rebuilt from it. "
                     'Run `python audio/remix.py` instead, or set SFX_LIBRARY to the library folder.')

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(SCRATCH, 'audio')
os.makedirs(OUT, exist_ok=True)
MOTION = json.load(open(os.path.join(HERE, 'motion.json')))
TL = MOTION['TL']
_mt, _mx = np.array(MOTION['motion']['t']), np.array(MOTION['motion']['curX'])


def cpan(t):
    """a click sits where the cursor is on screen (gently: at most a third of the way to a speaker)"""
    return float(np.clip((np.interp(t, _mt, _mx) - 960) / 960 * 0.34, -0.34, 0.34))
DUR = 50.0
N = int(SR * DUR)
SH = 20.0  # v1's outro plays 20 s later


LOG = []  # (bus, label, start, peak time, own peak level) for QA


class Bus:
    def __init__(self, name=''):
        self.y = np.zeros((N, 2))
        self.name = name

    def add(self, t, src, g=0.0, off=0.0, dur=None, fi=0.0, fo=0.02, semis=0, pan_=0.0, hp_=None, lp_=None, align='start'):
        """place a library file (or an array) so its sample at `off` lands at film time t"""
        if isinstance(src, str):
            x = varispeed(load(src), semis)
            x = x[int(max(0, off) * SR):]
            if dur is not None:
                x = x[: int(dur * SR)]
        else:
            x = src if src.ndim == 2 else pan(src, 0)
        if len(x) == 0:
            return
        if hp_:
            x = hp(x, hp_, 2)
        if lp_:
            x = lp(x, lp_, 2)
        x = fade(x, fi, fo)
        if pan_:
            m = x.mean(1)
            x = pan(m, pan_) * 0.8 + x * 0.2
        if align == 'peak':
            t = t - np.argmax(envelope_follow(x, 0.001, 0.05)) / SR
        elif align == 'end':
            t = t - len(x) / SR
        x = x * db(g)
        if self.name in ('ui', 'sfx'):
            k = bp(x, 800, 6000).mean(1) ** 2                      # the band where clicks and pops read
            w_ = int(0.02 * SR)
            st_ = np.convolve(k, np.ones(w_) / w_, 'same')
            ip = int(np.argmax(st_))
            LOG.append((self.name, os.path.basename(src) if isinstance(src, str) else 'array', t, t + ip / SR, 10 * np.log10(st_[ip] + 1e-12)))
        i0 = int(round(t * SR))
        if i0 < 0:
            x = x[-i0:]
            i0 = 0
        i1 = min(N, i0 + len(x))
        if i1 > i0:
            self.y[i0:i1] += x[: i1 - i0]


def gain_curve(points):
    ts = np.array([p[0] for p in points])
    gs = np.array([p[1] for p in points])
    return db(np.interp(np.arange(N) / SR, ts, gs))[:, None]


# ================================================================================================ library
C = 'Candy - Designed'
MAJ, MIN, OTH = C + '/Tonal Elements/Major/', C + '/Tonal Elements/Minor/', C + '/Tonal Elements/Other/'
KEY, STR, BAS = C + '/Instruments/Piano & Keys/', C + '/Instruments/Strings/', C + '/Instruments/Basses/'
FX = C + '/Special Effects/'
# ---- sound design: one family of soft, warm UI sounds with a clear attack
CLK_NAV = ['UI Click 4.wav', 'UI Click 2.wav', 'UI Click 1.wav']     # nav clicks (soft, tonal)
CLK_KEY = 'UIClick_CLICK-Keyboard Click 01_Ocular_Vector.wav'       # button presses (warm, defined)
CLK_SEL = 'UIClick_CLICK-Click 03_Ocular_Vector.wav'                # clicking into a field / choosing
BODY = 'UI Button Basic Transient Low Click Bass Pop Short 01.wav'  # a quiet low body under the main buttons
BEEP = ['PadBeepDullThunkyBeepButtonsUI_LAXP4_04.wav', 'PadBeepDullThunkyBeepButtonsUI_LAXP4_08.wav']  # ~E♭5, confirmations
BUB = ['Bubble_message_%02d.wav' % i for i in range(1, 7)]           # soft pops for things appearing
POP_OPEN, POP_CLOSE = 'Digital Pop Up 01 Open.wav', 'Digital Pop Up 02 Close.wav'
WOOD = ['OBJMisc_FOLEY-Wood Put Down On Desk 06_Ocular_Utility.wav', 'OBJMisc_FOLEY-Wood Put Down On Desk 02_Ocular_Utility.wav', 'OBJMisc_FOLEY-Wood Put Down On Desk 07_Ocular_Utility.wav']
TILES = ['UIMisc_TILES-Paper Tiles %02d_Ocular_Vector.wav' % i for i in range(1, 5)]
TILE_BIG = 'UIMisc_TILES-Tiles 01_Ocular_Vector.wav'
SLIDE = 'UIMisc_FOLEY-Slide_Ocular_Vector.wav'
FLIP = ['PAPRHndl_BOOKS AND NOTES-Flip 07_Ocular_Utility.wav', 'PAPRHndl_BOOKS AND NOTES-Flip 15_Ocular_Utility.wav']
KEYS = ['CMPTKey_TYPING-Mechanical Keyboard Single Key Down Up Quick Press 06_Ocular_Utility.wav',
        'CMPTKey_TYPING-Apple Keyboard Single Key Down Up Quick Press 04_Ocular_Utility.wav',
        'CMPTKey_TYPING-Mechanical Keyboard Single Key Down Up Quick Press 09_Ocular_Utility.wav',
        'CMPTKey_TYPING-Apple Keyboard Single Key Down Up Quick Press 19_Ocular_Utility.wav',
        'CMPTKey_TYPING-Mechanical Keyboard Single Key Down Up Quick Press 02_Ocular_Utility.wav',
        'CMPTKey_TYPING-Apple Keyboard Single Key Down Up Quick Press 06_Ocular_Utility.wav']
HOVER = ['UIClick_HOVER-Simple Hover 04_Ocular_Vector.wav', 'UIClick_HOVER-Simple Hover 03_Ocular_Vector.wav']
THUMP = ['Combat Punch Bassy Muted Padded Low Thump 04.wav', 'Combat Punch Bassy Muted Padded Low Thump 03.wav', 'Combat Punch Bassy Muted Padded Low Thump 06.wav']
SOFT = ['Impact Soft 01.wav', 'Impact Soft 02.wav', 'Impact Soft 03.wav', 'Impact Soft 04.wav']
CLICKSEQ = FX + 'Percussive/UIClick_PERCUSSIVE-Click Sequence_Ocular_Candy.wav'
WINDUP = FX + 'Percussive/UIClick_PERCUSSIVE-Click Wind Up_Ocular_Candy.wav'
SNAP = FX + 'Percussive/UIClick_PERCUSSIVE-Soft Snap 02_Ocular_Candy.wav'
GLITCH = FX + 'Textures/DSGNEthr_TEXTURE-Digital Glitches_Ocular_Candy.wav'
WGLITCH = FX + 'Textures/DSGNEthr_TEXTURE-Weird Data Glitches_Ocular_Candy.wav'
WOBBLY = FX + 'Textures/DSGNEthr_TEXTURE-Wobbly Textures_Ocular_Candy.wav'
SUCTION = FX + 'Reverse/DSGNRise_REVERSE-Glitchy Suction_Ocular_Candy.wav'
LIQSUCTION = FX + 'Reverse/DSGNRise_REVERSE-Liquid Suction_Ocular_Candy.wav'
INTO = 'DSGNRise_RISER-Into the Light_Ocular_Foundation.wav'
SCISSOR = 'Transition Whoosh Scissors Cut Short Subtle.wav'
BUBBLES = FX + 'Whooshes/DSGNWhsh_WHOOSH-Digital Bubbles Whoosh_Ocular_Candy.wav'
W = {  # whooshes with body *and* air (centroids 0.5–2.7 kHz), for real camera moves only
    'paper': 'UIMvmt_WHOOSH-Paper Fast Whoosh_Ocular_Vector.wav',
    'airy': 'UIMvmt_WHOOSH-Airy Whoosh 05_Ocular_Vector.wav',
    'speed': 'DSGNWhsh_WHOOSH-Speed is Everything_Ocular_Foundation.wav',
    'organic': FX + 'Whooshes/DSGNWhsh_WHOOSH-Organic Whoosh_Ocular_Candy.wav',
    'wave': FX + 'Whooshes/DSGNWhsh_WHOOSH-Wave Whoosh_Ocular_Candy.wav',
    'water': FX + 'Whooshes/DSGNWhsh_WHOOSH-Water Movement Fast_Ocular_Candy.wav',
    'airyfast': FX + 'Whooshes/DSGNWhsh_WHOOSH-Airy Whoosh Fast_Ocular_Candy.wav',
    'gritty': FX + 'Whooshes/DSGNWhsh_WHOOSH-Gritty Big Whoosh_Ocular_Candy.wav',
    'longorg': FX + 'Whooshes/DSGNWhsh_WHOOSH-Long Organic Whoosh_Ocular_Candy.wav',
}
IMP = {
    'dark': FX + 'Impacts/DSGNImpt_IMPACT-Deep Dark Impact_Ocular_Candy.wav',
    'kick': FX + 'Impacts/DSGNImpt_IMPACT-Huge Kick Long Tail_Ocular_Candy.wav',
    'sub': FX + 'Impacts/DSGNImpt_IMPACT-Sub Impact_Ocular_Candy.wav',
    'subrev': FX + 'Impacts/DSGNImpt_IMPACT-Sub Impact Reverb_Ocular_Candy.wav',
    'deeprev': FX + 'Impacts/DSGNImpt_IMPACT-Deep Reverb Impact_Ocular_Candy.wav',
    'rumble': FX + 'Impacts/DSGNImpt_IMPACT-Rumble Impact_Ocular_Candy.wav',
    'metal': FX + 'Impacts/DSGNImpt_IMPACT-Metallic Deep Impact_Ocular_Candy.wav',
}

music, sfx, ui = Bus('music'), Bus('sfx'), Bus('ui')


# ================================================================================================ MUSIC
import score
_score, _score_stems, SCORE_KICKS = score.render()
music.y[:] = _score * db(-17.0)                     # the score renders hot; this sets it under the sound design


# ================================================================================================ SOUND DESIGN
def ev(t, path, g, hp_=150, **kw):
    """a UI sound: natural tone, high-passed above the bass"""
    ui.add(t, path, g=g, hp_=hp_, **kw)


def whoosh(t, key, g=-15, **kw):
    """a camera move; t is where the whoosh peaks"""
    sfx.add(t, W[key], g=g, align='peak', fo=kw.pop('fo', 0.25), dur=kw.pop('dur', 1.4), hp_=kw.pop('hp_', 70), **kw)


def press(t, g=-17.5, body=-25):
    """the cursor presses a button: a warm click with a quiet low body"""
    ev(t, CLK_KEY, g, pan_=cpan(t))
    if body is not None:
        sfx.add(t, BODY, g=body, hp_=40)


def typing(t0, t1, g=-15.0, seed=0):
    """soft keys at a human rate (about 11 a second) while the text appears"""
    rng = np.random.default_rng(seed)
    n = max(2, int((t1 - t0) * 11))
    for i in range(n):
        T = t0 + (t1 - t0) * (i + rng.uniform(-0.25, 0.25)) / n
        ev(T, KEYS[rng.integers(len(KEYS))], g + rng.uniform(-2.5, 1.0), pan_=rng.uniform(-0.12, 0.12))


# ---- 0–8: the montage, the problems, the mark (v1's sync points, softer sounds)
sfx.add(0.0, IMP['dark'], g=-14)
whoosh(0.3, 'airyfast', g=-16, dur=1.0)                               # the line opens into the letterbox
ev(0.07, CLICKSEQ, -20)                                               # the kicker decodes
for i, T in enumerate([0.5, 1.0, 1.5, 2.0, 2.5]):                     # the five cuts
    whoosh(T - 0.03, 'paper', g=-13, pan_=0.25 * (-1) ** i, dur=0.6)
    sfx.add(T, SOFT[i % 4], g=-13, hp_=60)
sfx.add(3.0 - 0.27, SCISSOR, g=-10)                                    # the letterbox slams shut
sfx.add(3.0, TILE_BIG, g=-16, hp_=80)
for k, T in enumerate([3.09, 3.18, 3.27, 3.36]):                      # the phrase duplicates itself
    ev(T, CLK_KEY, -12, semis=2 * k, pan_=(-0.5 if k % 2 else 0.5))
    ev(T, TILES[k], -19, pan_=(0.4 if k % 2 else -0.4))
whoosh(3.72, 'paper', g=-10)                                          # the wall rushes out
sfx.add(3.72, WGLITCH, g=-17, dur=0.4, fo=0.1, hp_=120)
sfx.add(3.75, SOFT[2], g=-10, hp_=60)
for T, o in [(3.8, 0.4), (3.87, 1.3), (3.99, 2.2), (4.18, 3.1)]:     # glitch jolts
    sfx.add(T, GLITCH, g=-8, off=o, dur=0.07, fi=0.003, fo=0.01)
sfx.add(4.5, WOBBLY, g=-15, dur=0.8, fo=0.1, hp_=80)                   # inconsistent evaluations
for j in range(0, 10, 2):                                             # the weights flicker
    ev(4.5 + j * (4 / 60), HOVER[(j // 2) % 2], -15, semis=(j * 5) % 7 - 3, pan_=((j % 5) - 2) * 0.2)
sfx.add(5.95, SUCTION, g=-9, align='end', fi=0.4, hp_=60)             # implosion
sfx.add(5.95 - 3.32, INTO, g=-12, dur=3.32, fo=0.03, fi=0.4)
sfx.add(6.0 - 0.02, IMP['metal'], g=-19, fo=1.0)
for i in range(3):                                                    # the wordmark's letters rise
    ev(6.6 + i * 0.06, HOVER[i % 2], -15, semis=i * 2)
whoosh(7.96, 'speed', g=-10)                                          # the whip into the platform

# ---- 8–16: Collaborate
sfx.add(8.0, IMP['rumble'], g=-22)                                       # the platform lands (the score's drop carries it)
for i in range(4):                                                    # the pipeline's stages light up
    ev(8.2 + 0.13 * i, BUB[[0, 4, 5, 3][i]], -15, pan_=-0.45 + 0.3 * i)
for i in range(3):                                                    # projects drop into their stages
    ev(8.8 + 0.12 * i, WOOD[i], -15)
ev(TL['stageMove'] - 0.05, SLIDE, -16)                                 # a project moves on
ev(TL['stageMove'] + 0.55, WOOD[1], -14)                               # ...and lands in the next stage
whoosh(TL['v1Out'] + 0.33, 'organic', g=-14)                           # into the app
press(TL['invite'], g=-16)                                                   # Invite your team
ev(TL['partner'] - 0.2, POP_OPEN, -9)                                # a partner agency joins
ev(TL['partner'] + 0.25, BEEP[0], -8)                                 # ...as Approver
whoosh(TL['extIn'] - 0.3, 'paper', g=-16, dur=0.6)                     # across to their project as it arrives
ev(TL['extIn'] + 0.2, WOOD[0], -14)
ev(TL['extIn'] + 0.3, FLIP[0], -16)
whoosh(TL['nav1'] - 0.6, 'paper', g=-20, dur=0.6)                      # up to the nav
ev(TL['nav1'], CLK_NAV[0], -13.5, pan_=cpan(TL['nav1']))                  # Quick Assessment
ev(TL['nav1'] + 0.12, TILES[0], -18)
whoosh(TL['v2In'] - 0.15, 'wave', g=-15)                               # out to the title
sfx.add(TL['v2In'], THUMP[1], g=-17)
# ---- 16–26: Innovate
whoosh(TL['v2Out'] + 0.3, 'water', g=-17)                              # back into the app
ev(TL['focusIn'], CLK_SEL, -14, pan_=cpan(TL['focusIn']))               # into the box
typing(TL['typeA'], TL['typeB'], seed=5)
ev(TL['plus'], CLK_SEL, -15, semis=1, pan_=cpan(TL['plus']))            # "+"
ev(TL['attach'] - 0.12, BUB[1], -13)                                   # the PDF attaches
ev(TL['attach'] + 0.05, FLIP[1], -16)
press(TL['assess'], g=-16.5, body=-22)                                    # Assess proposal
sfx.add(TL['assess'] + 0.06, BUBBLES, g=-16, dur=0.5, fo=0.15, hp_=150)  # ...working, as the camera drops to the brief
ev(TL['brief'], WOOD[2], -14)                                          # the brief lands
for i in range(3):                                                    # TRL · IRL · ORL
    ev(TL['brief'] + 0.22 + 0.1 * i, TILES[i + 1], -18, pan_=-0.3 + 0.3 * i)
whoosh(TL['badges'] - 0.27, 'paper', g=-21, dur=0.5)                   # in on the readiness scale
ev(TL['badges'], BEEP[0], -5)                                         # declared 7
ev(TL['badges'] + 0.1, BEEP[1], -6, semis=-3)                         # assessor 6
ev(TL['badges'] + 0.2, SLIDE, -17)                                     # the callout
whoosh(TL['nav2'] - 0.5, 'airy', g=-19, dur=0.8)                       # back out to the nav
ev(TL['nav2'], CLK_NAV[1], -13.5, pan_=cpan(TL['nav2']))                  # Strategy Hub
whoosh(TL['v3In'] - 0.25, 'longorg', g=-16, dur=2.4, fo=0.6)          # the crane over the table
sfx.add(TL['nav2'] + 0.2, SOFT[0], g=-12, hp_=60)                             # the tiles rise off the table
sfx.add(TL['nav2'] + 0.42, SOFT[3], g=-12, hp_=60)
sfx.add(TL['v3In'], THUMP[2], g=-17)
# ---- 26–33: Strategise
ev(TL['creep'], WINDUP, -15, dur=0.58, fo=0.03)                        # "creep" stretches out...
ev(TL['creep'] + 0.58, SNAP, -19)                                      # ...and is clamped back
sfx.add(TL['creep'] + 0.58, THUMP[0], g=-16)
whoosh(TL['v3Out'] + 0.3, 'organic', g=-15)                            # into the app
press(TL['align'], g=-17.5, body=-25)                                    # Align project
ev(TL['align'] - 0.12, POP_OPEN, -10)
ev(TL['pick'], CLK_SEL, -14, pan_=cpan(TL['pick']))                     # Camera Detection – Smoke
ev(TL['pick'] - 0.08, POP_CLOSE, -11, hp_=100)
ev(TL['rowUpd'] + 0.05, BEEP[1], -5)                                  # the gap is covered
for i in range(3):                                                    # coverage, counts, unaligned
    ev(TL['tilesUpd'] + 0.07 * i, BUB[[3, 5, 0][i]], -15, pan_=-0.25 + 0.25 * i)
whoosh(TL['tilesUpd'] - 0.33, 'paper', g=-20, dur=0.6)                 # up to the tiles
ev(TL['nav3'], CLK_NAV[2], -14, pan_=cpan(TL['nav3']))                  # Commons
whoosh(TL['v4In'] - 0.2, 'airyfast', g=-15)
sfx.add(TL['v4In'], THUMP[1], g=-17)
# ---- 33–42: Solve
whoosh(TL['v4Out'] + 0.3, 'water', g=-15)
ev(TL['searchClick'], CLK_SEL, -14, pan_=cpan(TL['searchClick']))
typing(TL['typeC'], TL['typeD'], seed=11)
whoosh(TL['ask'] - 0.45, 'paper', g=-18, dur=0.6)                      # across to Ask Heyden
press(TL['ask'], g=-16.5, body=-22)                                       # Ask Heyden
ev(TL['ask'] - 0.1, POP_OPEN, -9)                                    # the task card
whoosh(TL['curated'] - 0.26, 'water', g=-19)                           # back to see the answer
ev(TL['curated'], WOOD[1], -15)                                        # the curated view
for i in range(2):                                                    # the matches light up
    ev(TL['curated'] + 0.12 + 0.12 * i, BUB[[0, 5][i]], -14, pan_=(-0.2, 0.2)[i])
whoosh(TL['recede'] + 0.23, 'gritty', g=-15, dur=2.0, fo=0.5)          # out to the globe
sfx.add(TL['recede'] + 0.1, IMP['subrev'], g=-18)
whoosh(TL['t1'] - 0.05, 'wave', g=-16)                                 # the push into the roles
# ---- 42–50: roles, "Ideas to Outcomes", the mark (v1's picture, 20 s later)
for i, p_ in enumerate([-0.7, 0.7]):                                  # the four roles fly in
    whoosh(22.02 + SH + 0.06 * i, 'airy', g=-15, pan_=p_, dur=0.9)
sfx.add(22.1 + SH, SOFT[0], g=-12, hp_=60)
sfx.add(22.37 + SH, SOFT[1], g=-11, hp_=60)
for i in range(4):                                                    # each role lights in turn: E♭ G B♭ E♭
    ev(22.75 + SH + i * 0.25, BEEP[i % 2], -5, semis=[0, 4, 7, 12][i], pan_=-0.45 + i * 0.3)
sfx.add(24.0 + SH - 0.27, SCISSOR, g=-11)
sfx.add(24.0 + SH - 0.02, IMP['deeprev'], g=-19)
for p_ in (-0.6, 0.6):
    whoosh(23.97 + SH, 'paper', g=-14, pan_=p_, dur=0.6)
whoosh(25.95 + SH, 'airyfast', g=-14)                                  # the words turn into the stems
sfx.add(26.0 + SH, LIQSUCTION, g=-13, align='end', fi=0.3, hp_=80)
sfx.add(26.0 + SH - 0.02, IMP['metal'], g=-20, fo=2.0)
for i in range(3):
    ev(26.62 + SH + i * 0.06, HOVER[i % 2], -14, semis=i * 2)
press(27.22 + SH, g=-10, body=-22)                                     # Get started
ev(27.3 + SH, BEEP[0], -7)
whoosh(27.95 + SH, 'airy', g=-16, dur=1.0)                             # sheen across the mark

# ================================================================================================ MIX + MASTER
music_duck = gain_curve([
    (0, 0), (5.9, 0), (5.93, -40), (6.0, -40), (6.01, -6), (6.6, 0),
    (45.72, 0), (45.9, -14), (45.99, -30), (46.01, -5), (46.7, 0), (50, 0),
])
# the open's heartbeat carries the cuts and the two logo hits land full; in the product section the music sits back
# a little and the UI comes forward: the story is told there, and every click should read
lift_music = gain_curve([(0, 3.0), (5.9, 3.0), (6.0, 2.5), (7.0, 2.5), (7.9, 0), (8.3, -2.0), (41.7, -2.0), (42.2, 0),
                         (45.95, 0), (46.0, 2.5), (48.5, 2.5), (50, 2.5)])
lift_ui = gain_curve([(0, 0), (7.9, 0), (8.1, 3.0), (41.9, 3.0), (42.1, 0), (50, 0)])
# the music dips 2.5 dB for a moment under each click, so the clicks read without being loud
CLICKS = [TL[k] for k in ('invite', 'nav1', 'focusIn', 'plus', 'assess', 'nav2', 'align', 'pick', 'nav3', 'searchClick', 'ask')]
click_duck = duck_curve(N, CLICKS, depth_db=2.5, attack=0.01, hold=0.06, release=0.25)[:, None]
music_bus = music.y * music_duck * lift_music * click_duck
gate = gain_curve([(0, 0), (5.935, 0), (5.955, -60), (5.965, -60), (5.975, 0), (50, 0)])
stems = {'music': music_bus, 'sfx': sfx.y * gate, 'ui': ui.y * lift_ui * gate}
mix = stems['music'] + stems['sfx'] + stems['ui']
# overall contour: the open and the ending sit a touch under the product section's level, so the story carries the film
fadeout = gain_curve([(0, -2.5), (7.9, -2.5), (8.1, 0), (41.9, 0), (42.1, -2.0), (49.1, -2.0), (50.0, -32)])
mix *= fadeout
for k_ in stems:
    stems[k_] = stems[k_] * fadeout


def master(st):
    """UI bus: a fast peak limiter that only shaves the first milliseconds of the sharpest clicks (release 15 ms, so
    nothing pumps); then the master limiter, which now only touches the biggest impacts"""
    ui_ = limiter(st['ui'], -4.5, release=0.015, lookahead=0.0015)
    return st['music'] + st['sfx'] + ui_, ui_


for _ in range(4):  # land at exactly -14 LUFS after the limiters
    m_, _fx = master(stems)
    adj = db(-14.0 - lufs(limiter(m_, -1.6)))
    for k_ in stems:
        stems[k_] = stems[k_] * adj
G = 20 * np.log10(np.abs(stems['music']).max() / max(1e-12, np.abs(music.y * music_duck * lift_music * click_duck * fadeout).max()))
json.dump({'gain_db': G, 'events': LOG}, open(os.path.join(OUT, 'events.json'), 'w'))
pre, fx_lim = master(stems)
mix = limiter(pre, -1.6)
red = 20 * np.log10(np.maximum(np.abs(mix).max(1), 1e-9) / np.maximum(np.abs(pre).max(1), 1e-9))
fx_red = 20 * np.log10(np.maximum(np.abs(fx_lim).max(1), 1e-9) / np.maximum(np.abs(stems['ui']).max(1), 1e-9))
print(f'UI-bus peak shaving: max {-fx_red.min():.1f} dB, {np.mean(fx_red < -0.5) * 100:.2f}% of samples')
sf.write(os.path.join(OUT, 'stem_ui_pre.wav'), stems['ui'].astype(np.float32), SR, subtype='FLOAT')
stems = {'music': stems['music'], 'effects': stems['sfx'] + fx_lim}
print(f'loudness {lufs(mix):.1f} LUFS, true peak {20 * np.log10(true_peak(mix)):.2f} dBTP, max limiting {-red.min():.1f} dB')
sf.write(os.path.join(OUT, 'mix_raw.wav'), mix.astype(np.float32), SR, subtype='FLOAT')
for k_, v in stems.items():
    sf.write(os.path.join(OUT, f'stem_{k_}.wav'), v.astype(np.float32), SR, subtype='FLOAT')

import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from scipy.signal import spectrogram
fig, axes = plt.subplots(3, 1, figsize=(26, 11), sharex=True, gridspec_kw={'height_ratios': [3, 1.2, 1.2]})
f, t, S_ = spectrogram(mix.mean(1), SR, nperseg=4096, noverlap=3072)
axes[0].pcolormesh(t, f, 10 * np.log10(S_ + 1e-12), shading='auto', cmap='magma', vmin=-120, vmax=-30)
axes[0].set_yscale('symlog', linthresh=100)
axes[0].set_ylim(20, 16000)
for name, st, ax in [('music', stems['music'], axes[1]), ('effects', stems['effects'], axes[2])]:
    e = np.sqrt(np.convolve(st.mean(1) ** 2, np.ones(2400) / 2400, 'same'))[::480]
    ax.plot(np.arange(len(e)) * 480 / SR, 20 * np.log10(e + 1e-6))
    ax.set_ylim(-70, 0)
    ax.set_ylabel(name)
for ax in axes:
    for T in [3, 6, 8, TL['nav1'], TL['v2In'], TL['nav2'], TL['v3In'], TL['nav3'], TL['v4In'], TL['recede'], 42, 44, 46]:
        ax.axvline(T, color='c', lw=0.6, alpha=0.6)
    ax.set_xticks(np.arange(0, 51, 1))
plt.tight_layout()
plt.savefig(os.path.join(OUT, 'qa_mix.png'), dpi=55)
print('short-term loudness:', ' '.join(f'{v:.0f}' for _, v in short_term(mix, 3.0, 2.0)))
