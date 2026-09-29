// Animation helpers. Everything is a pure function of time so any frame can be rendered in any order.
export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a, b, t) => a + (b - a) * t;
export const inv = (a, b, x) => clamp((x - a) / (b - a));
export const TAU = Math.PI * 2;

export const E = {
  linear: (t) => t,
  inQuad: (t) => t * t,
  outQuad: (t) => 1 - (1 - t) * (1 - t),
  inOutQuad: (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2),
  inCubic: (t) => t * t * t,
  outCubic: (t) => 1 - Math.pow(1 - t, 3),
  inOutCubic: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  inQuart: (t) => t * t * t * t,
  outQuart: (t) => 1 - Math.pow(1 - t, 4),
  inOutQuart: (t) => (t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2),
  inQuint: (t) => t * t * t * t * t,
  outQuint: (t) => 1 - Math.pow(1 - t, 5),
  inOutQuint: (t) => (t < 0.5 ? 16 * t * t * t * t * t : 1 - Math.pow(-2 * t + 2, 5) / 2),
  inExpo: (t) => (t <= 0 ? 0 : Math.pow(2, 10 * t - 10)),
  outExpo: (t) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t)),
  inOutExpo: (t) => (t <= 0 ? 0 : t >= 1 ? 1 : t < 0.5 ? Math.pow(2, 20 * t - 10) / 2 : (2 - Math.pow(2, -20 * t + 10)) / 2),
  outBack: (t) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); },
  outBackSoft: (t) => { const c1 = 0.9, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); },
  inBack: (t) => { const c1 = 1.70158, c3 = c1 + 1; return c3 * t * t * t - c1 * t * t; },
  outCirc: (t) => Math.sqrt(1 - Math.pow(t - 1, 2)),
  inCirc: (t) => 1 - Math.sqrt(1 - t * t),
};

// value from a to b while t runs t0..t1
export const anim = (t, t0, t1, a, b, ease = E.outCubic) => lerp(a, b, ease(inv(t0, t1, t)));

// keyframes: [[time, value], [time, value, easeIntoThisKey], ...]
export function kf(t, keys) {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    const [t1, v1, e] = keys[i];
    const [t0, v0] = keys[i - 1];
    if (t < t1) return lerp(v0, v1, (e || E.inOutCubic)(inv(t0, t1, t)));
  }
  return keys[keys.length - 1][1];
}

// critically-damped-ish spring settle: 0 at t<=0, overshoots, settles at 1
export function spring(t, freq = 3.2, damp = 5.5) {
  if (t <= 0) return 0;
  return 1 - Math.exp(-damp * t) * Math.cos(freq * TAU * t);
}

// deterministic hashing / noise
export function hash(n) {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453123;
  return x - Math.floor(x);
}
export const hash2 = (a, b) => hash(a * 57.31 + b * 113.97);
export function rng(seed) {
  let a = seed >>> 0 || 1;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export function noise1(x, seed = 0) {
  const i = Math.floor(x), f = x - i;
  const u = f * f * (3 - 2 * f);
  return lerp(hash(i + seed * 101.3), hash(i + 1 + seed * 101.3), u) * 2 - 1;
}
// fractal smooth noise, roughly -1..1
export const fbm = (x, seed = 0) => noise1(x, seed) * 0.6 + noise1(x * 2.1, seed + 7) * 0.3 + noise1(x * 4.3, seed + 13) * 0.1;

// DOM helpers
export function el(tag, cls, parent, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text != null) e.textContent = text;
  if (parent) parent.appendChild(e);
  return e;
}
export function div(cls, parent, text) { return el('div', cls, parent, text); }

// split text into per-character spans (spaces preserved). Returns array of spans.
export function splitChars(node, text) {
  node.textContent = '';
  return [...text].map((ch) => {
    const s = el('span', 'ch', node);
    s.textContent = ch === ' ' ? ' ' : ch;
    return s;
  });
}
// split into words; each word is wrapped in a mask span containing an inner span
export function splitWords(node, text, masked = true) {
  node.textContent = '';
  const words = text.split(' ');
  return words.map((w, i) => {
    const outer = el('span', masked ? 'wmask' : 'w', node);
    const inner = el('span', 'wi', outer, w);
    if (i < words.length - 1) node.appendChild(document.createTextNode(' '));
    return inner;
  });
}

export const setT = (e, s) => { if (e._t !== s) { e.style.transform = s; e._t = s; } };
export const setO = (e, o) => { const v = o.toFixed(4); if (e._o !== v) { e.style.opacity = v; e._o = v; } };
export const show = (e, on) => { const v = on ? '' : 'none'; if (e._d !== v) { e.style.display = v; e._d = v; } };
export const setF = (e, s) => { if (e._f !== s) { e.style.filter = s; e._f = s; } };

// ---------- v3 additions ----------
// CSS-style cubic-bezier easing (x1, y1, x2, y2), solved by Newton iteration with a bisection fallback
export function bezier(x1, y1, x2, y2) {
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
  const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
  const sx = (u) => ((ax * u + bx) * u + cx) * u;
  const sy = (u) => ((ay * u + by) * u + cy) * u;
  const dx = (u) => (3 * ax * u + 2 * bx) * u + cx;
  return (x) => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    let u = x;
    for (let i = 0; i < 8; i++) {
      const e = sx(u) - x;
      if (Math.abs(e) < 1e-6) return sy(u);
      const d = dx(u);
      if (Math.abs(d) < 1e-6) break;
      u -= e / d;
    }
    let lo = 0, hi = 1; u = x;
    for (let i = 0; i < 30; i++) { const e = sx(u); if (Math.abs(e - x) < 1e-6) break; if (e < x) lo = u; else hi = u; u = (lo + hi) / 2; }
    return sy(u);
  };
}
// the product's own settle curve (site.css: commons-ask-task-settle, .42s cubic-bezier(.2,.9,.2,1))
E.hey = bezier(0.2, 0.9, 0.2, 1);
E.inOutSine = (t) => -(Math.cos(Math.PI * t) - 1) / 2;

// Monotone cubic Hermite through [t, v] keys (Fritsch–Butland tangents), so camera moves flow through keys
// without stopping unless a key is a local extreme. A key's optional third element fixes its tangent (units/s).
// Ends ease in and out.
export function spline(keys) {
  const n = keys.length;
  const T = keys.map((k) => k[0]), V = keys.map((k) => k[1]);
  const d = [];
  for (let i = 0; i < n - 1; i++) d.push((V[i + 1] - V[i]) / (T[i + 1] - T[i]));
  const m = new Array(n);
  for (let i = 0; i < n; i++) {
    if (keys[i].length > 2 && keys[i][2] != null) { m[i] = keys[i][2]; continue; }
    if (i === 0 || i === n - 1) { m[i] = 0; continue; }
    if (d[i - 1] * d[i] <= 0) { m[i] = 0; continue; }
    const h0 = T[i] - T[i - 1], h1 = T[i + 1] - T[i];
    const w1 = 2 * h1 + h0, w2 = h1 + 2 * h0;
    m[i] = (w1 + w2) / (w1 / d[i - 1] + w2 / d[i]);
  }
  return (x) => {
    if (x <= T[0]) return V[0];
    if (x >= T[n - 1]) return V[n - 1];
    let i = 0;
    while (x > T[i + 1]) i++;
    const h = T[i + 1] - T[i], s = (x - T[i]) / h, s2 = s * s, s3 = s2 * s;
    return (2 * s3 - 3 * s2 + 1) * V[i] + (s3 - 2 * s2 + s) * h * m[i] + (-2 * s3 + 3 * s2) * V[i + 1] + (s3 - s2) * h * m[i + 1];
  };
}
export const setTxt = (e, s) => { if (e._x !== s) { e.textContent = s; e._x = s; } };
export const setW = (e, w) => { const v = w.toFixed(2) + 'px'; if (e._w !== v) { e.style.width = v; e._w = v; } };
// outExpo normalised so it reaches exactly 1 (E.outExpo stops 0.1% short, then snaps)
E.outExpoN = (t) => (t >= 1 ? 1 : (1 - Math.pow(2, -10 * t)) / (1 - Math.pow(2, -10)));
