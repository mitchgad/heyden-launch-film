"""DSP toolkit for the v3 score and sound design: oscillators, filters, envelopes, reverb, loudness, limiting.
Everything is deterministic (seeded) so the mix renders identically every time."""
import os, subprocess, hashlib
from fractions import Fraction
import numpy as np
from numba import njit
from scipy.signal import butter, sosfilt, resample_poly, fftconvolve

SR = 48000
_REPO = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
SFX = os.environ.get('SFX_LIBRARY', os.path.join(_REPO, 'sfx'))  # the sound library; not part of this repo
SCRATCH = os.environ.get('SCRATCH', os.path.join(_REPO, 'build'))
CACHE = os.path.join(SCRATCH, 'audiocache')
os.makedirs(CACHE, exist_ok=True)


def mtof(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def db(g):
    return 10 ** (g / 20)


# ------------------------------------------------------------------ samples from ../sfx
_mem = {}


def load(path):
    """stereo float32 at SR; path relative to the library or absolute"""
    if path in _mem:
        return _mem[path]
    full = path if path.startswith('/') else os.path.join(SFX, path)
    key = hashlib.md5(full.encode()).hexdigest() + '.f32'
    cp = os.path.join(CACHE, key)
    if not os.path.exists(cp):
        raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', full, '-f', 'f32le', '-ac', '2', '-ar', str(SR), '-'],
                             capture_output=True, check=True).stdout
        open(cp, 'wb').write(raw)
    x = np.fromfile(cp, dtype=np.float32).reshape(-1, 2).astype(np.float64)
    _mem[path] = x
    return x


def varispeed(x, semis):
    """pitch by resampling (duration changes with it, like tape)"""
    if not semis:
        return x
    r = Fraction(2 ** (-semis / 12)).limit_denominator(240)
    return resample_poly(x, r.numerator, r.denominator, axis=0)


# ------------------------------------------------------------------ filters
def lp(x, fc, order=2):
    return sosfilt(butter(order, fc, 'lp', fs=SR, output='sos'), x, axis=0)


def hp(x, fc, order=2):
    return sosfilt(butter(order, fc, 'hp', fs=SR, output='sos'), x, axis=0)


def bp(x, lo, hi, order=2):
    return sosfilt(butter(order, [lo, hi], 'bandpass', fs=SR, output='sos'), x, axis=0)


@njit(cache=True)
def _svf(x, fc, res, mode):
    # Zavalishin TPT state-variable filter with a per-sample cutoff. mode 0 = low-pass, 1 = band-pass, 2 = high-pass
    n = x.shape[0]
    y = np.zeros(n)
    ic1 = 0.0
    ic2 = 0.0
    k = 2.0 - 2.0 * res
    for i in range(n):
        f = fc[i]
        if f < 10.0:
            f = 10.0
        if f > 0.45 * 48000.0:
            f = 0.45 * 48000.0
        g = np.tan(np.pi * f / 48000.0)
        a1 = 1.0 / (1.0 + g * (g + k))
        a2 = g * a1
        a3 = g * a2
        v3 = x[i] - ic2
        v1 = a1 * ic1 + a2 * v3
        v2 = ic2 + a2 * ic1 + a3 * v3
        ic1 = 2.0 * v1 - ic1
        ic2 = 2.0 * v2 - ic2
        if mode == 0:
            y[i] = v2
        elif mode == 1:
            y[i] = v1
        else:
            y[i] = x[i] - k * v1 - v2
    return y


def svf(x, fc, res=0.2, mode='lp'):
    """time-varying filter; x mono or stereo, fc scalar or per-sample array"""
    m = {'lp': 0, 'bp': 1, 'hp': 2}[mode]
    fc = np.broadcast_to(np.asarray(fc, dtype=np.float64), (x.shape[0],)).copy()
    if x.ndim == 1:
        return _svf(x.astype(np.float64), fc, float(res), m)
    return np.stack([_svf(x[:, c].astype(np.float64).copy(), fc, float(res), m) for c in range(x.shape[1])], axis=1)


# ------------------------------------------------------------------ oscillators and envelopes
def phase(freq, n, ph0=0.0):
    f = np.broadcast_to(np.asarray(freq, dtype=np.float64), (n,))
    return (ph0 + np.cumsum(f) / SR) % 1.0


def _polyblep(p, dt):
    out = np.zeros_like(p)
    a = p < dt
    t = p[a] / dt[a]
    out[a] = t + t - t * t - 1.0
    b = p > 1.0 - dt
    t = (p[b] - 1.0) / dt[b]
    out[b] = t * t + t + t + 1.0
    return out


def saw(freq, n, ph0=0.0):
    f = np.broadcast_to(np.asarray(freq, dtype=np.float64), (n,))
    p = phase(f, n, ph0)
    dt = np.maximum(f / SR, 1e-9)
    return 2.0 * p - 1.0 - _polyblep(p, dt)


def square(freq, n, ph0=0.0, pw=0.5):
    f = np.broadcast_to(np.asarray(freq, dtype=np.float64), (n,))
    dt = np.maximum(f / SR, 1e-9)
    p = phase(f, n, ph0)
    s = np.where(p < pw, 1.0, -1.0)
    s = s + _polyblep(p, dt) - _polyblep((p + 1 - pw) % 1.0, dt)
    return s


def sine(freq, n, ph0=0.0):
    return np.sin(2 * np.pi * phase(freq, n, ph0))


def noise(n, seed):
    return np.random.default_rng(seed).standard_normal(n)


def pink(n, seed):
    # Voss-McCartney-ish via filtered white noise (-3 dB/oct approximation)
    w = noise(n, seed)
    b = [0.049922035, -0.095993537, 0.050612699, -0.004408786]
    a = [1, -2.494956002, 2.017265875, -0.522189400]
    from scipy.signal import lfilter
    y = lfilter(b, a, w)
    return y / (np.abs(y).max() + 1e-9)


def env_adsr(n, a, d, s, r, dur):
    """a/d/r in seconds, s level; note held for dur seconds then released"""
    t = np.arange(n) / SR
    e = np.where(t < a, t / max(a, 1e-6), 1.0)
    dd = (t >= a) & (t < a + d)
    e[dd] = 1.0 - (1.0 - s) * (t[dd] - a) / max(d, 1e-6)
    e[(t >= a + d)] = s
    rel = t >= dur
    if rel.any():
        lvl = e[min(n - 1, int(dur * SR))] if int(dur * SR) < n else s
        e[rel] = lvl * np.exp(-(t[rel] - dur) / max(r / 4.6, 1e-6))
    return e


def fade(x, fi=0.0, fo=0.0):
    x = x.copy()
    n = len(x)
    if fi > 0:
        k = min(n, int(fi * SR))
        x[:k] *= (np.linspace(0, 1, k) ** 2)[:, None] if x.ndim == 2 else np.linspace(0, 1, k) ** 2
    if fo > 0:
        k = min(n, int(fo * SR))
        x[n - k:] *= (np.linspace(1, 0, k) ** 2)[:, None] if x.ndim == 2 else np.linspace(1, 0, k) ** 2
    return x


def pan(x, p):
    """mono -> stereo, equal power; p in -1..1 (scalar or per-sample)"""
    th = (np.asarray(p) + 1) * np.pi / 4
    return np.stack([x * np.cos(th), x * np.sin(th)], axis=1) * np.sqrt(2)


def width(x, w):
    m = x.mean(1, keepdims=True)
    return m + (x - m) * w


def sat(x, drive=1.0):
    return np.tanh(x * drive) / np.tanh(drive)


# ------------------------------------------------------------------ reverb
def reverb_ir(rt=(2.6, 1.9, 0.8), length=3.2, seed=7, predelay=0.012, bright=1.0):
    """stereo IR: decorrelated noise with a slower decay for lows than highs (dark hall)"""
    n = int(length * SR)
    t = np.arange(n) / SR
    out = np.zeros((n, 2))
    for c in range(2):
        w = noise(n, seed + 31 * c)
        lo = lp(w, 450, 2)
        mid = bp(w, 450, 3200, 2)
        hi = hp(w, 3200, 2) * bright
        for band, r in ((lo, rt[0]), (mid, rt[1]), (hi, rt[2])):
            out[:, c] += band * np.exp(-6.9 * t / r)
    k = int(predelay * SR)
    out = np.concatenate([np.zeros((k, 2)), out])[:n]
    # fade-in of the tail (diffusion build-up)
    out *= np.minimum(1, t / 0.02)[:, None]
    return out / np.sqrt((out ** 2).sum(0).mean())


def convolve(x, ir):
    return np.stack([fftconvolve(x[:, c], ir[:, c])[: len(x)] for c in range(2)], axis=1)


def delay(x, time, fb=0.3, lpf=2500, mix=0.3, ping=True):
    """stereo feedback delay (ping-pong), damped"""
    d = int(time * SR)
    y = np.zeros_like(x)
    tap = x.copy()
    g = 1.0
    for i in range(1, 7):
        g *= fb if i > 1 else 1.0
        tap = lp(tap, lpf, 1)
        sh = np.zeros_like(x)
        sh[d * i:] = tap[: len(x) - d * i] * g
        if ping and i % 2 == 1:
            sh = sh[:, ::-1]
        y += sh
    return x + y * mix


# ------------------------------------------------------------------ dynamics and loudness
def envelope_follow(x, att=0.003, rel=0.12):
    a = np.abs(x).max(1) if x.ndim == 2 else np.abs(x)
    return _follow(a, np.exp(-1 / (att * SR)), np.exp(-1 / (rel * SR)))


@njit(cache=True)
def _follow(a, ca, cr):
    y = np.zeros_like(a)
    e = 0.0
    for i in range(a.shape[0]):
        v = a[i]
        c = ca if v > e else cr
        e = v + (e - v) * c
        y[i] = e
    return y


def duck_curve(n, times, depth_db=6.0, attack=0.004, hold=0.03, release=0.22):
    """sidechain-style gain curve from trigger times"""
    g = np.zeros(n)
    t = np.arange(n) / SR
    for T in times:
        i0 = int(T * SR)
        if i0 >= n:
            continue
        k = slice(max(0, i0 - int(attack * SR)), min(n, i0 + int((hold + release * 5) * SR)))
        tt = t[k] - T
        shape = np.where(tt < 0, 1 + tt / attack, np.where(tt < hold, 1.0, np.exp(-(tt - hold) / release)))
        g[k] = np.maximum(g[k], np.clip(shape, 0, 1))
    return db(-depth_db * g)


def k_weight(x):
    # ITU-R BS.1770 K-weighting at 48 kHz
    b1 = [1.53512485958697, -2.69169618940638, 1.19839281085285]
    a1 = [1.0, -1.69065929318241, 0.73248077421585]
    b2 = [1.0, -2.0, 1.0]
    a2 = [1.0, -1.99004745483398, 0.99007225036621]
    from scipy.signal import lfilter
    return lfilter(b2, a2, lfilter(b1, a1, x, axis=0), axis=0)


def lufs(x):
    y = k_weight(x)
    blk, hop = int(0.4 * SR), int(0.1 * SR)
    ms = []
    for i in range(0, len(y) - blk, hop):
        ms.append((y[i:i + blk] ** 2).mean(0).sum())
    ms = np.array(ms)
    L = -0.691 + 10 * np.log10(ms + 1e-12)
    g1 = ms[L > -70]
    Lr = -0.691 + 10 * np.log10(g1.mean() + 1e-12) - 10
    g2 = ms[(L > -70) & (L > Lr)]
    return -0.691 + 10 * np.log10(g2.mean() + 1e-12)


def short_term(x, win=3.0, hop=0.5):
    y = k_weight(x)
    blk, h = int(win * SR), int(hop * SR)
    out = []
    for i in range(0, len(y) - blk + 1, h):
        out.append((i / SR + win / 2, -0.691 + 10 * np.log10((y[i:i + blk] ** 2).mean(0).sum() + 1e-12)))
    return out


def true_peak(x):
    return np.abs(resample_poly(x, 4, 1, axis=0)).max()


def limiter(x, ceiling_db=-1.5, release=0.09, lookahead=0.003):
    """look-ahead peak limiter on a 4x oversampled peak envelope. The gain never exceeds what each sample needs:
    min-filter over +-L, then a length-L moving average (still <= the need at every sample), then release-only smoothing."""
    from scipy.ndimage import minimum_filter1d, uniform_filter1d
    c = db(ceiling_db)
    os_ = np.abs(resample_poly(x, 4, 1, axis=0)).max(1)
    pk = os_[: 4 * len(x)].reshape(-1, 4).max(1)
    if len(pk) < len(x):
        pk = np.pad(pk, (0, len(x) - len(pk)))
    need = np.minimum(1.0, c / np.maximum(pk, 1e-12))
    L = max(1, int(lookahead * SR))
    g = minimum_filter1d(need, size=2 * L + 1)
    g = uniform_filter1d(g, size=L)
    g = np.minimum(g, need)
    g = _release(g, np.exp(-1 / (release * SR)))
    return x * g[:, None]


@njit(cache=True)
def _release(g, cr):
    y = np.zeros_like(g)
    prev = 1.0
    for i in range(g.shape[0]):
        v = g[i]
        if v < prev:
            prev = v
        else:
            prev = v + (prev - v) * cr
        y[i] = prev
    return y
