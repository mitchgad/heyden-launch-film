"""The v3 score: a restrained, groovy 120 BPM track, written and synthesised here (no samples).

Key: A♭ major, with its relative F minor carrying the open. The loop is vi–IV–I–V (Fm9 · D♭maj9 · A♭maj9 · E♭6/9):
warm and confident with a little weight to it. The upper voicing barely moves (C and E♭ stay put while one or two
voices step), which keeps it smooth under the picture. Everything sits on the film's 120 BPM grid (beat 0.5 s,
bar 2 s), the grid v1's cuts and logo hits already use.

  0–6    the problems: a muffled kick on every cut, a low F drone, a pulsing bass, a snare roll and riser into the logo
  6–8    the logo: a D♭maj9 hit, then the beat fades up under a filter
  8–16   Collaborate: the groove lands — kick, clap, offbeat hat, a syncopated bass, Rhodes-style chords on a 3-3-2
  16–26  Innovate: + a plucked arpeggio through a ping-pong delay, + soft swung 16th hats
  26–28  the Strategise title: a breakdown on D♭maj9, a riser under "Kill scope creep", the beat back at 28
  28–40  the groove, fuller for Solve (+ shaker and a hand percussion part)
  40–42  the globe: the drums drop out, the chords breathe, a build into the roles
  42–46  the roles and "Ideas to Outcomes": the full groove
  46–50  the mark: a final A♭maj9 rings out

Instruments (all synthesised in numpy): a tuned kick with a pitch sweep and a short click; a layered clap; 808-style
metallic hats and cymbals (six detuned squares through band-pass filters); a pluck bass (sine sub + filtered saw);
an FM electric piano (a body pair and a short tine pair, with tremolo); a detuned-saw pad; a plucked arpeggio;
noise risers and a sub drop. Mixed with kick sidechain, a plate reverb and a ping-pong delay.
"""
import numpy as np
from dsp import SR, lp, hp, bp, svf, saw, square, sine, noise, reverb_ir, convolve, delay, duck_curve, fade, db, pan

BPM = 120.0
BEAT = 60.0 / BPM          # 0.5 s
BAR = 4 * BEAT             # 2 s
STEP = BEAT / 4            # a 16th, 0.125 s
SWING = 0.014              # added to every off-16th: about 56% swing
DUR = 50.0
N = int(SR * DUR)


def T(bar, step=0.0):
    """time of a 16th step in a bar (bars count from the film's start); off-16ths swing"""
    t = bar * BAR + step * STEP
    if abs(step - round(step)) < 1e-9 and int(round(step)) % 2 == 1:
        t += SWING
    return t


def mtof(m):
    return 440.0 * 2 ** ((m - 69) / 12)


_PC = {'C': 0, 'Db': 1, 'D': 2, 'Eb': 3, 'E': 4, 'F': 5, 'Gb': 6, 'G': 7, 'Ab': 8, 'A': 9, 'Bb': 10, 'B': 11}


def nt(name):
    """'Ab3' -> midi (C4 = 60)"""
    return 12 * (int(name[-1]) + 1) + _PC[name[:-1]]


# the loop: bass root and a four-voice upper voicing that barely moves
CH = {
    'Fm9':  ('F1',  ['Ab3', 'C4', 'Eb4', 'G4']),
    'Dbmaj9': ('Db2', ['Ab3', 'C4', 'Eb4', 'F4']),
    'Abmaj9': ('Ab1', ['Bb3', 'C4', 'Eb4', 'G4']),
    'Eb69': ('Eb2', ['Bb3', 'C4', 'Eb4', 'F4']),   # E♭6/9
}
LOOP = ['Fm9', 'Dbmaj9', 'Abmaj9', 'Eb69']


class Bus:
    def __init__(self):
        self.y = np.zeros((N, 2))

    def put(self, t, x, g=0.0, p=0.0):
        """place a mono or stereo array at time t (seconds), gain g dB, pan p"""
        if x.ndim == 1:
            x = pan(x, p)
        elif p:
            m = x.mean(1)
            x = pan(m, p) * 0.7 + x * 0.3
        i0 = int(round(t * SR))
        x = x * db(g)
        if i0 < 0:
            x = x[-i0:]
            i0 = 0
        i1 = min(N, i0 + len(x))
        if i1 > i0:
            self.y[i0:i1] += x[: i1 - i0]


def _t(d):
    return np.arange(int(d * SR)) / SR


# ================================================================================================ drums
def kick(f0=48.0, dec=0.24, click=0.22, seed=1):
    t = _t(0.48)
    f = f0 + 170 * np.exp(-t / 0.017) + 55 * np.exp(-t / 0.11)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR)
    amp = np.minimum(1, t / 0.0006) * np.exp(-t / dec) * (1 - (t / t[-1]) ** 6)
    ck = bp(noise(len(t), seed), 1800, 7000) * np.exp(-t / 0.0022) * click
    x = body * amp + ck
    return np.tanh(1.7 * x) / np.tanh(1.7)


def muffled_kick(f0=46.0):
    """the intro's heartbeat: the same kick, low-passed so it thumps rather than knocks"""
    return lp(kick(f0, dec=0.26, click=0.05), 260, 2)


def clap(seed=2):
    t = _t(0.55)
    out = np.zeros((len(t), 2))
    for c in range(2):
        w = bp(noise(len(t), seed + 11 * c), 950, 4200)
        e = np.zeros(len(t))
        for dt, a in [(0.0, 0.55), (0.0095, 0.7), (0.0195, 0.85)]:           # three hands, then the room
            m = t >= dt
            e[m] += a * np.exp(-(t[m] - dt) / 0.0035)
        m = t >= 0.029
        e[m] += np.exp(-(t[m] - 0.029) / 0.10)
        out[:, c] = w * e
    out = hp(out, 600, 2)
    return out / np.abs(out).max()


def snare(v=1.0, seed=3):
    t = _t(0.4)
    body = (np.sin(2 * np.pi * 186 * t) + 0.5 * np.sin(2 * np.pi * 330 * t)) * np.exp(-t / 0.045)
    sn = lp(hp(noise(len(t), seed), 1700, 2), 8500, 2) * np.exp(-t / 0.085)
    x = 0.8 * body + 0.8 * sn
    x *= np.minimum(1, t / 0.0008) * (1 - (t / t[-1]) ** 4)
    return np.tanh(1.4 * x * v) / np.tanh(1.4)


_METAL = np.array([205.3, 304.4, 369.6, 522.7, 540.0, 800.0])


def _metal(d, mult=1.0):
    n = int(d * SR)
    return sum(square(f * mult, n, ph0=0.13 * k) for k, f in enumerate(_METAL)) / 6


def hat(open_=False, v=1.0, seed=4):
    d = 0.5 if open_ else 0.12
    t = _t(d)
    x = _metal(d, 1.0)
    x = bp(x, 6800, 11500, 2)
    x = hp(x, 6200, 2) + 0.25 * hp(noise(len(t), seed), 9000, 2)
    e = np.minimum(1, t / 0.0005) * np.exp(-t / (0.16 if open_ else 0.026))
    if open_:
        e *= 1 - (t / t[-1]) ** 3
    x = x * e
    x = lp(x, 14000, 2)
    return x / (np.abs(x).max() + 1e-9) * v


def cymbal(d=2.6, seed=5):
    """a soft crash: metallic squares + noise, bright band, long decay"""
    t = _t(d)
    m = _metal(d, 1.37)
    x = 0.6 * bp(m, 3200, 12000, 2) + 0.5 * hp(noise(len(t), seed), 4500, 2)
    e = np.minimum(1, t / 0.002) * (0.35 * np.exp(-t / 0.08) + 0.65 * np.exp(-t / 1.1))
    x = x * e * (1 - (t / t[-1]) ** 2)
    out = np.stack([x, np.roll(x, 211) * 0.96], axis=1)
    out = lp(out, 13000, 2)
    return out / np.abs(out).max()


def shaker(v=1.0, seed=6):
    t = _t(0.09)
    x = bp(noise(len(t), seed), 4500, 10000, 2)
    e = np.minimum(1, t / 0.007) * np.exp(-t / 0.028)
    x = x * e
    return x / (np.abs(x).max() + 1e-9) * v


def tok(f=310.0, v=1.0):
    """a soft hand-drum tok: a short pitch-dropping sine with a little skin noise"""
    t = _t(0.42)
    fr = f * (1 + 0.35 * np.exp(-t / 0.012))
    x = np.sin(2 * np.pi * np.cumsum(fr) / SR) * np.exp(-t / 0.075)
    x += 0.12 * bp(noise(len(t), 9), 1500, 5000) * np.exp(-t / 0.006)
    x *= np.minimum(1, t / 0.0008) * (1 - (t / t[-1]) ** 4)
    return x / np.abs(x).max() * v


# ================================================================================================ bass, keys, pad, pluck
def bass_note(m, d, v=1.0):
    f = mtof(m)
    t = _t(d + 0.06)
    x = 0.9 * np.sin(2 * np.pi * f * t) + 0.5 * saw(f, len(t), ph0=0.5)
    fc = 330 + (950 * v) * np.exp(-t / 0.08)
    x = svf(x, fc, 0.18, 'lp')
    a = np.minimum(1, t / 0.003) * (0.78 + 0.22 * np.exp(-t / 0.09))
    a *= np.clip((d + 0.06 - t) / 0.06, 0, 1)                       # 60 ms release at the note's end
    x = np.tanh(1.5 * x * a * v) / np.tanh(1.5)
    return x


def ep_note(m, d, v=1.0, seed=0):
    """FM electric piano: a body pair (1:1, index falling) and a tine pair (1:14, very short), long decay"""
    f = mtof(m)
    rel = 0.22
    t = _t(d + rel)
    ib = (0.6 + 1.3 * v) * np.exp(-t / 0.45) + 0.2
    body = np.sin(2 * np.pi * f * t + ib * np.sin(2 * np.pi * f * t))
    it = 2.2 * v * np.exp(-t / 0.018)
    tine = np.sin(2 * np.pi * f * t + it * np.sin(2 * np.pi * 14.0 * f * t)) * np.exp(-t / 0.05)
    x = body + 0.3 * tine
    a = np.minimum(1, t / 0.0015) * (0.55 * np.exp(-t / 0.3) + 0.45 * np.exp(-t / 2.2))
    a *= np.clip((d + rel - t) / rel, 0, 1) ** 2
    x = x * a * (0.55 + 0.45 * v)
    # tremolo-pan: the Rhodes' stereo wobble
    ph = 2 * np.pi * 3.2 * t + seed
    return np.stack([x * (1 + 0.22 * np.sin(ph)), x * (1 - 0.22 * np.sin(ph))], axis=1)


def ep_chord(notes, d, v=1.0, spread=0.008, seed=0):
    """a chord with a slight human roll between the voices"""
    out = None
    for k, name in enumerate(notes):
        x = ep_note(nt(name), d - k * spread, v * (0.92 + 0.08 * ((k * 7 + seed) % 3) / 2), seed + k)
        x = np.concatenate([np.zeros((int(k * spread * SR), 2)), x])
        out = x if out is None else _sum(out, x)
    return out


def _sum(a, b):
    if len(a) < len(b):
        a, b = b, a
    a = a.copy()
    a[: len(b)] += b
    return a


def pad_chord(notes, d, att=0.6, rel=1.2, cutoff=1600, seed=0):
    """seven detuned saws per voice, spread across the stereo field, slow filter drift"""
    t = _t(d + rel)
    n = len(t)
    L, R = np.zeros(n), np.zeros(n)
    rng = np.random.default_rng(seed)
    for name in notes:
        f = mtof(nt(name))
        for k, c in enumerate(np.linspace(-0.16, 0.16, 7)):
            s = saw(f * 2 ** (c / 12), n, ph0=rng.random())
            w = 0.5 + 0.5 * np.sin(k * 1.3)
            L += s * w
            R += s * (1 - w)
    x = np.stack([L, R], axis=1)
    fc = cutoff * (1 + 0.25 * np.sin(2 * np.pi * 0.18 * t + seed))
    x = svf(x, fc, 0.12, 'lp')
    a = np.minimum(1, t / att) ** 2 * np.clip((d + rel - t) / rel, 0, 1) ** 2
    x = hp(x * a[:, None], 180, 2)
    return x / (np.abs(x).max() + 1e-9)


def pluck(m, v=1.0):
    f = mtof(m)
    t = _t(0.7)
    x = 0.65 * saw(f, len(t)) + 0.35 * square(f, len(t), pw=0.28)
    x = hp(x, 90, 2)                                                        # the pulse's DC
    fc = 450 + 6000 * v * np.exp(-t / 0.07)
    x = svf(x, fc, 0.28, 'lp')
    a = np.minimum(1, t / 0.001) * np.exp(-t / 0.16) * (1 - (t / t[-1]) ** 4)
    return x * a * v


# ================================================================================================ effects
def riser(d, f0=350, f1=6500, seed=7, tone=None):
    t = _t(d)
    n = len(t)
    u = t / d
    fc = f0 * (f1 / f0) ** u
    out = np.stack([svf(noise(n, seed + c), fc, 0.45, 'bp') for c in range(2)], axis=1)
    out *= (u ** 2.2)[:, None]
    if tone is not None:                              # a quiet rising fifth under the noise
        fr = mtof(tone) * 2 ** (7 * u ** 1.6 / 12)
        s = lp(saw(fr, n), 2500, 2) * u ** 1.8 * 0.35
        out += s[:, None]
    out = fade(out, 0, 0.012)
    return out / (np.abs(out).max() + 1e-9)


def swell(d, seed=8):
    """a reversed cymbal: the wash rising into a downbeat"""
    x = cymbal(d + 0.2, seed)[: int(d * SR)][::-1]
    x = x * (np.linspace(0, 1, len(x)) ** 2.5)[:, None]
    return fade(x, 0, 0.01)


def sub_drop(d=1.4, f0=92, f1=36):
    t = _t(d)
    f = f1 + (f0 - f1) * np.exp(-t / 0.22)
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.minimum(1, t / 0.002) * np.exp(-t / 0.55)
    return np.tanh(1.3 * x)


def downlifter(d=1.2, seed=10):
    t = _t(d)
    u = t / d
    fc = 6000 * (300 / 6000) ** u
    out = np.stack([svf(noise(len(t), seed + c), fc, 0.4, 'bp') for c in range(2)], axis=1)
    out *= ((1 - u) ** 1.5)[:, None] * np.minimum(1, t / 0.01)[:, None]
    return out / (np.abs(out).max() + 1e-9)


# ================================================================================================ the arrangement
def render():
    rng = np.random.default_rng(42)
    kickB, clapB, hatB, percB, bassB, keysB, padB, arpB, fxB = (Bus() for _ in range(9))
    kicks = []                                                            # every kick, for the sidechain

    K = kick()
    KM = muffled_kick()
    CL = clap()
    OH = [hat(True, 1.0, 40 + i) for i in range(4)]
    CHH = [hat(False, 1.0, 50 + i) for i in range(4)]
    SH = [shaker(1.0, 60 + i) for i in range(4)]

    def chord_at(bar, half=0):
        # the loop runs from the drop at 8 s; the ending is a cadence: vi at the roles, IV at "Ideas to Outcomes",
        # V as it builds, I on the mark
        if bar == 21:
            return 'Fm9'
        if bar == 22:
            return 'Dbmaj9' if half == 0 else 'Eb69'
        return LOOP[(bar - 4) % 4]

    def hum(s=0.0025):
        return rng.uniform(-s, s)

    # ---------------------------------------------------------------- 0–6: the problems
    padB.put(0.0, pad_chord(['F2', 'C3', 'Ab3'], 5.9, att=1.2, rel=0.2, cutoff=700, seed=1), g=-9)
    bassB.put(0.0, lp(bass_note(nt('F1'), 2.8, 0.5), 300, 2), g=-6)
    for T0 in [0.5, 1.0, 1.5, 2.0, 2.5]:                                # a heartbeat on every cut
        kickB.put(T0, KM, g=-3)
        kicks.append(T0)
    kickB.put(3.0, K, g=-1)                                               # the letterbox slams
    kicks.append(3.0)
    clapB.put(3.0, CL, g=-8)
    fxB.put(3.0, cymbal(1.6, 21), g=-17)
    for i in range(12):                                                   # "Duplicated effort": a pulsing bass
        T0 = 3.0 + i * STEP * 2
        bassB.put(T0, lp(bass_note(nt('F1') + (12 if i % 4 == 3 else 0), STEP * 1.6, 0.55 + 0.03 * i), 320 + 60 * i, 2), g=-4)
    for T0 in [3.5, 4.0, 4.5, 5.0, 5.5]:
        kickB.put(T0, KM, g=-4)
        kicks.append(T0)
    for i in range(12):                                                   # hats creep in
        hatB.put(3.0 + (i * 2 + 1) * STEP + SWING, CHH[i % 4], g=-30 + i * 0.8, p=0.25)
    for i in range(14):                                                   # the snare roll into the logo (16ths, then 32nds)
        v = 0.3 + 0.7 * (i / 13) ** 1.5
        T0 = 4.5 + (i if i < 8 else 8 + (i - 8) * 0.5) * STEP
        clapB.put(T0, snare(v, 70 + i), g=-14 + 6 * (i / 13))
    fxB.put(4.5, riser(1.43, 300, 7000, tone=nt('C3')), g=-13)
    # ---------------------------------------------------------------- 6–8: the mark
    kickB.put(6.0, K, g=0)
    kicks.append(6.0)
    fxB.put(6.0, sub_drop(1.6), g=-6)
    fxB.put(6.0, cymbal(2.8, 22), g=-13)
    keysB.put(6.0, ep_chord(['Db3', 'Ab3', 'C4', 'Eb4', 'F4'], 1.9, 0.9, seed=3), g=-5)
    padB.put(6.0, pad_chord(['Db3', 'Ab3', 'C4', 'F4'], 1.6, att=0.02, rel=0.9, cutoff=2400, seed=2), g=-12)
    bassB.put(6.0, bass_note(nt('Db2'), 1.4, 0.7), g=-5)
    for i, T0 in enumerate([7.0, 7.5]):                                   # the beat fades up under a filter
        kickB.put(T0, lp(K, 400 + 900 * i, 2), g=-6 + 2 * i)
        kicks.append(T0)
    for i in range(8):
        clapB.put(7.0 + i * STEP, snare(0.35 + 0.08 * i, 80 + i), g=-19 + 1.2 * i)
    fxB.put(6.6, riser(1.35, 400, 8000, seed=13, tone=nt('Eb3')), g=-15)
    fxB.put(8.0 - 0.9, swell(0.9, 23), g=-20)

    # ---------------------------------------------------------------- 8–46: the groove
    #   16th steps per bar; the kick is four to the floor, the clap on 2 and 4, an open hat on every offbeat
    BASS = [(0, 0, 2, 1.0), (3, 0, 1, 0.62), (6, 12, 1, 0.8), (7, 0, 1, 0.6), (10, 0, 2, 0.9), (13, 7, 1, 0.7), (14, 0, 1, 0.8)]
    BASS_LIGHT = [(0, 0, 3, 1.0), (6, 12, 1, 0.75), (10, 0, 3, 0.9), (14, 0, 1, 0.75)]
    COMP = [(0, 3, 0.95), (6, 2, 0.8), (10, 3, 0.88)]                    # 3-3-2 in eighths, played as short stabs
    ARP = [0, 2, 3, 5, 6, 8, 10, 11, 13, 14]
    breakdown = {13, 20}
    for bar in range(4, 23):
        t0 = bar * BAR
        # energy per chapter
        full = bar >= 17 or bar in (21, 22)
        arp_on = 8 <= bar <= 22 and bar not in breakdown
        hats16 = bar >= 8 and bar not in breakdown
        perc_on = bar >= 14 and bar not in breakdown
        if bar in breakdown:
            continue
        # ---- drums
        for s in ((0, 4) if bar == 22 else (0, 4, 8, 12)):                # the last beat before the mark builds without it
            kickB.put(T(bar, s), K, g=-1)
            kicks.append(T(bar, s))
        for s in (4, 12):
            clapB.put(T(bar, s) + 0.004, CL, g=-7.5)
        for s in (2, 6, 10, 14):                                          # (a player never hits two the same)
            hatB.put(T(bar, s) + hum(), OH[(bar + s) % 4], g=-20 + (1.5 if s == 14 else 0) + rng.uniform(-1.2, 0.6), p=0.18)
        if hats16:
            for s in range(1, 16, 2):
                acc = 2.5 if s in (7, 15) else 0.0
                hatB.put(T(bar, s) + hum(), CHH[s % 4], g=-29 + acc + (2 if full else 0) + rng.uniform(-1.5, 0.8), p=0.3)
        if full:
            for s in range(16):
                SHg = -30 + (3 if s % 4 == 2 else 0) + (1.5 if s % 2 else 0)
                percB.put(T(bar, s) + hum(0.003), SH[s % 4], g=SHg, p=-0.35)
        if perc_on:
            for s, f, g in [(3, 330, -21), (11, 290, -22), (14, 390, -24)]:
                percB.put(T(bar, s) + hum(), tok(f), g=g, p=-0.25)
        # ---- bass
        at = lambda s: CH[chord_at(bar, int(s >= 8))]
        pat = BASS_LIGHT if bar < 8 else BASS
        for s, iv, ln, v in pat:
            bassB.put(T(bar, s), bass_note(nt(at(s)[0]) + iv, ln * STEP * 0.92, v), g=-3.5)
        # ---- Rhodes comping
        for s, ln, v in COMP:
            keysB.put(T(bar, s), ep_chord(at(s)[1], ln * STEP * 0.95, v, seed=bar * 3 + s), g=-8.5)
        # ---- pad (quiet glue)
        for h in ((0, 1) if bar == 22 else (0,)):
            d = BAR / 2 if bar == 22 else BAR
            padB.put(t0 + h * d, pad_chord(CH[chord_at(bar, h)][1], d - 0.1, att=0.25, rel=0.5, cutoff=1500, seed=bar + h), g=-11)
        # ---- plucked arpeggio
        if arp_on:
            order = [0, 2, 1, 3, 2, 1, 3, 2, 0, 3]
            up = 12 if bar >= 17 else 0
            for k, s in enumerate(ARP):
                tones = [nt(v) + 12 for v in at(s)[1]]
                vv = 0.75 + 0.25 * (s % 4 == 0) - 0.12 * (s % 2)
                arpB.put(T(bar, s), pluck(tones[order[k]] + up, vv), g=2)

    # ---------------------------------------------------------------- fills and accents
    fxB.put(8.0, cymbal(2.4, 20), g=-17)                                  # the drop
    for i, s in enumerate(range(12, 16)):                                 # into Innovate
        clapB.put(T(7, s), snare(0.45 + 0.15 * i, 90 + i), g=-15 + 1.5 * i)
    fxB.put(16.0, cymbal(2.2, 24), g=-19)
    fxB.put(T(11, 2) - 0.02, riser(0.5, 800, 5000, seed=31), g=-24)      # Assess ...
    keysB.put(24.0, ep_chord(['Ab3', 'C4', 'Eb4', 'G4', 'C5'], 0.4, 0.95, seed=5), g=-12)   # ... the brief, the badges
    for i, s in enumerate(range(10, 16)):                                 # into the Strategise breakdown
        clapB.put(T(12, s), snare(0.4 + 0.1 * i, 100 + i), g=-16 + 1.2 * i)
    # 26–28: breakdown on D♭maj9, a riser under "Kill scope creep", the beat back at 28
    fxB.put(26.0, cymbal(2.6, 25), g=-16)
    fxB.put(26.0, sub_drop(1.5, 80, 34), g=-9)
    keysB.put(26.0, ep_chord(CH['Dbmaj9'][1] + ['Ab4'], 1.9, 0.85, seed=11), g=-8)
    padB.put(26.0, pad_chord(CH['Dbmaj9'][1], 1.95, att=0.5, rel=0.4, cutoff=1900, seed=26), g=-14)
    bassB.put(26.0, bass_note(nt('Db2'), 1.8, 0.7), g=-5)
    fxB.put(27.0, riser(1.0, 400, 7000, seed=33, tone=nt('Eb3')), g=-15)
    fxB.put(28.0, cymbal(2.4, 26), g=-18)
    # the Solve title lands on the "and" of three: a stab and a crash
    keysB.put(33.25, ep_chord(['F3', 'Ab3', 'C4', 'Eb4', 'G4'], 0.5, 1.0, seed=17), g=-9)
    fxB.put(33.25, cymbal(2.4, 27), g=-17)
    fxB.put(T(19, 4), riser(0.55, 600, 6000, seed=35), g=-22)            # Ask Heyden ...
    for i, s in enumerate(range(12, 16)):                                 # into the globe
        clapB.put(T(19, s), snare(0.4 + 0.15 * i, 110 + i), g=-16 + 1.5 * i)
    # 40–42: the globe — the drums drop out, the chords breathe, a build into the roles
    fxB.put(40.0, cymbal(2.6, 28), g=-17)
    keysB.put(40.0, ep_chord(CH['Dbmaj9'][1], 0.95, 0.8, seed=19), g=-9)
    keysB.put(41.0, ep_chord(['Bb3', 'Eb4', 'F4', 'Ab4'], 0.9, 0.75, seed=23), g=-10)   # E♭sus
    padB.put(40.0, pad_chord(CH['Dbmaj9'][1], 0.95, att=0.3, rel=0.3, cutoff=1800, seed=40), g=-14)
    padB.put(41.0, pad_chord(['Bb3', 'Eb4', 'F4', 'Ab4'], 0.9, att=0.2, rel=0.2, cutoff=2400, seed=41), g=-14)
    bassB.put(40.0, bass_note(nt('Db2'), 0.95, 0.6), g=-6)
    bassB.put(41.0, bass_note(nt('Eb2'), 0.9, 0.6), g=-6)
    fxB.put(41.0, riser(0.95, 350, 8000, seed=37, tone=nt('Bb2')), g=-13)
    for i in range(12):
        T0 = 41.0 + (i if i < 8 else 8 + (i - 8) * 0.5) * STEP
        clapB.put(T0, snare(0.3 + 0.7 * (i / 11) ** 1.4, 120 + i), g=-16 + 6 * (i / 11))
    # 42–46: the roles and "Ideas to Outcomes"
    fxB.put(42.0, cymbal(2.4, 29), g=-15)
    fxB.put(42.0, sub_drop(1.2, 80, 38), g=-10)
    fxB.put(44.0, cymbal(2.4, 30), g=-15)                                 # "Ideas to Outcomes" lands
    keysB.put(44.0, ep_chord(['Db3'] + CH['Dbmaj9'][1] + ['Ab4'], 0.45, 1.0, seed=29), g=-9)
    fxB.put(45.0, riser(0.9, 400, 8000, seed=39, tone=nt('Eb3')), g=-13)
    for i in range(8):
        clapB.put(45.0 + i * STEP, snare(0.35 + 0.09 * i, 130 + i), g=-17 + 1.4 * i)
    # 46–50: the mark — the last chord rings out
    kickB.put(46.0, K, g=0)
    kicks.append(46.0)
    fxB.put(46.0, sub_drop(1.8, 90, 34), g=-6)
    fxB.put(46.0, cymbal(3.6, 31), g=-12)
    keysB.put(46.0, ep_chord(['Ab2', 'Eb3', 'G3', 'C4', 'Eb4', 'Bb4'], 3.4, 1.0, seed=31), g=-5)
    padB.put(46.0, pad_chord(['Ab2', 'Eb3', 'G3', 'C4', 'Bb4'], 3.2, att=0.02, rel=0.8, cutoff=2600, seed=46), g=-11)
    bassB.put(46.0, bass_note(nt('Ab1'), 2.6, 0.8), g=-4)
    for k, m in enumerate(['Ab4', 'C5', 'Eb5', 'G5', 'Bb5', 'C6']):      # a last arpeggio, left to the delay
        arpB.put(46.0 + 0.5 + k * STEP * 1.5, pluck(nt(m), 0.8 - 0.08 * k), g=-2)

    # ================================================================ mix
    sc = duck_curve(N, kicks, depth_db=6.0, attack=0.002, hold=0.02, release=0.16)[:, None]
    sc_light = duck_curve(N, kicks, depth_db=2.5, attack=0.002, hold=0.02, release=0.14)[:, None]
    plate = reverb_ir(rt=(1.5, 1.3, 0.7), length=2.2, seed=91, predelay=0.02, bright=0.8)
    hall = reverb_ir(rt=(3.2, 2.6, 1.2), length=4.0, seed=93, predelay=0.03, bright=0.7)
    # tonal balance, checked against the long-term spectrum of a typical modern mix: the kick and bass sit lower,
    # the keys lose some 100–170 Hz body and a little 300–500 Hz box, and the keys and arpeggio stay under the drums
    # so the 0.5–2 kHz band doesn't honk; the clap, hats and shaker carry the presence
    drums = kickB.y * db(-5.5) + clapB.y + hatB.y + percB.y
    bass = lp(bassB.y, 4000, 2) * sc * db(-5.5)
    keys = hp(keysB.y, 170, 2)
    keys = keys - 0.3 * bp(keys, 280, 520, 1) - 0.37 * bp(keys, 480, 1150, 1)    # less box, less honk
    keys = keys * sc_light * db(-4.0)
    pad = padB.y * sc * db(-2.0)
    arp = hp(delay(arpB.y, 0.375, fb=0.38, lpf=3200, mix=0.42), 250, 2)
    arp = (arp - 0.3 * bp(arp, 480, 1150, 1)) * sc_light * db(-3.0)
    drums = drums + 0.33 * clapB.y                                             # the clap a touch forward
    sends = 0.22 * clapB.y + 0.16 * keysB.y + 0.3 * arpB.y + 0.3 * padB.y + 0.1 * percB.y
    verb = hp(convolve(sends, plate), 280, 2)
    verb = lp(verb, 9000, 2) * sc_light
    tail = np.zeros((N, 2))                                               # the ending gets a bigger room
    i46 = int(46.0 * SR)
    tail[i46:] = convolve(0.35 * (keysB.y[i46:] + padB.y[i46:] + arpB.y[i46:]), hall)[: N - i46]
    fx = fxB.y
    stems = {
        'drums': np.tanh(1.1 * drums) / np.tanh(1.1),
        'bass': bass, 'keys': keys, 'pad': pad, 'arp': arp,
        'verb': verb + hp(tail, 200, 2), 'fx': fx,
    }
    music = sum(stems.values())
    music = hp(music, 28, 2)
    return music, stems, kicks


if __name__ == '__main__':
    import os, soundfile as sf
    from dsp import SCRATCH, lufs
    out = os.path.join(SCRATCH, 'audio')
    os.makedirs(out, exist_ok=True)
    m, st, _ = render()
    print('score loudness %.1f LUFS, peak %.1f dBFS' % (lufs(m), 20 * np.log10(np.abs(m).max())))
    for k, v in st.items():
        print(f'  {k:6s} {lufs(v) if np.abs(v).max() > 1e-6 else -99:6.1f} LUFS')
    sf.write(os.path.join(out, 'score.wav'), (m / np.abs(m).max() * 0.9).astype(np.float32), SR, subtype='FLOAT')
