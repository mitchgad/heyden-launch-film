import { clamp, lerp, inv, anim, kf, E, spring, hash, hash2, fbm, TAU, div, el, splitChars, splitWords, setT, setO, show } from '../lib.js';

export const HM = { aspect: 0.83756, stem: 0.20633, barTop: 0.40161, barH: 0.17697 }; // Inter Bold (opsz 32) "H"

// the brand mark built from three bars so each can move on its own
export function makeH(parent, h) {
  const w = h * HM.aspect, s = h * HM.stem;
  const root = div('hmark', parent);
  root.style.width = w + 'px';
  root.style.height = h + 'px';
  const part = (x, y, pw, ph) => {
    const p = div('p', root);
    Object.assign(p.style, { left: x + 'px', top: y + 'px', width: pw + 'px', height: ph + 'px', backgroundSize: w + 'px 100%', backgroundPosition: -x + 'px 0' });
    return p;
  };
  const L = part(0, 0, s, h), R = part(w - s, 0, s, h), B = part(s - 0.5, h * HM.barTop, w - 2 * s + 1, h * HM.barH);
  return { root, L, R, B, w, h, s };
}

// ------------------------------------------------------------------ S1: montage 0.00–3.00
const WORDS = ['Prevention', 'Preparedness', 'Detection', 'Response', 'Recovery'];
const SHOTS = [
  { n: 'fire', a: 0.0, b: 0.5, s: 0.4, v: 1.0, z: [1.24, 1.15], dx: [-24, 10], dy: [12, -6], f: 'contrast(1.32) saturate(1.1) brightness(0.72)' },
  { n: 'crop', a: 0.5, b: 1.0, s: 0.2, v: 1.4, z: [1.17, 1.06], dx: [46, 6], dy: [0, 0], f: 'contrast(1.16) saturate(1.0) brightness(0.8)' },
  { n: 'flood', a: 1.0, b: 1.5, s: 0.9, v: 1.5, z: [1.18, 1.07], dx: [0, -20], dy: [-30, 0], f: 'contrast(1.38) saturate(0.78) brightness(0.74) sepia(0.12)' },
  { n: 'smoke', a: 1.5, b: 2.0, s: 0.5, v: 1.3, z: [1.16, 1.06], dx: [-40, -8], dy: [0, 0], f: 'contrast(1.12) saturate(0.86) brightness(0.8)' },
  { n: 'heli', a: 2.0, b: 2.5, s: 0.9, v: 1.4, z: [1.2, 1.08], dx: [30, 0], dy: [20, 0], f: 'contrast(1.14) saturate(0.9) brightness(0.8)' },
  { n: 'hose', a: 2.5, b: 3.05, s: 0.5, v: 1.5, z: [1.18, 1.08], dx: [0, 30], dy: [0, 0], f: 'contrast(1.22) saturate(0.9) brightness(0.8)' },
];
const shotAt = (t) => SHOTS.find((s) => t >= s.a && t < s.b) || SHOTS[SHOTS.length - 1];
const SLIT = 392; // half-height of the letterbox

export const S1 = {
  t0: 0, t1: 3.0,
  needs(t, api) {
    const s = shotAt(t);
    return [{ name: s.n, idx: Math.floor((s.s + (t - s.a) * s.v) * 29.97) }];
  },
  build(world) {
    this.root = div('scene s1', world);
    this.clip = div('s1-clip', this.root);
    this.cv = el('canvas', 's1-cv', this.clip);
    this.cv.width = 1920; this.cv.height = 1080;
    this.c = this.cv.getContext('2d');
    div('s1-tint', this.clip);
    div('s1-grade', this.clip);
    this.kicker = div('s1-kicker', this.clip);
    this.kch = splitChars(this.kicker, 'EMERGING TECHNOLOGIES FOR');
    this.kch.forEach((ch) => { ch.style.width = ch.getBoundingClientRect().width + 'px'; });
    this.wrap = div('s1-wordwrap', this.clip);
    this.words = WORDS.map((w) => div('s1-word', this.wrap, w));
    this.count = div('s1-count', this.clip);
    this.lt = div('s1-line', this.root);
    this.lb = div('s1-line', this.root);
  },
  mb(t) {
    for (let i = 0; i < 5; i++) { const T = 0.5 + i * 0.5; if (t > T - 0.02 && t < T + 0.2) return 8; }
    return t > 2.8 ? 8 : 4;
  },
  update(t, imgs, api) {
    // letterbox slit: a hot line opens into a wide frame, then slams shut
    let hh = SLIT * E.outExpo(inv(0.06, 0.6, t));
    hh *= 1 - E.inExpo(inv(2.78, 3.0, t));
    this.clip.style.clipPath = `inset(${(540 - hh).toFixed(2)}px 0 ${(540 - hh).toFixed(2)}px 0)`;
    const lw = lerp(90, 1920, E.outExpo(inv(0, 0.42, t)));
    const lo = t < 0.06 ? 1 : 0.95;
    for (const [e, y] of [[this.lt, 540 - hh - 1], [this.lb, 540 + hh - 1]]) {
      e.style.width = lw + 'px';
      setT(e, `translate(${960 - lw / 2}px, ${y}px)`);
      setO(e, lo);
    }

    // footage
    const s = shotAt(t);
    const img = imgs[s.n];
    const c = this.c;
    const p = inv(s.a, s.b, t);
    const z = lerp(s.z[0], s.z[1], E.outCubic(p));
    const kick = Math.exp(-Math.max(0, t - s.a) * 18) * (s.a > 0 ? 1 : 0);
    const dx = lerp(s.dx[0], s.dx[1], E.outCubic(p)), dy = lerp(s.dy[0], s.dy[1], E.outCubic(p));
    c.save();
    c.filter = s.f + ` brightness(${(1 + kick * 0.55).toFixed(3)})`;
    const w = 1920 * (z + kick * 0.04), h = 1080 * (z + kick * 0.04);
    c.drawImage(img, 960 - w / 2 + dx, 540 - h / 2 + dy, w, h);
    c.restore();
    api.drawEmbers(c, t, { count: 46, seed: 4, speed: [70, 240], size: [0.8, 2.4], alpha: 0.85, drift: 50 });

    // kicker decode
    const pool = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const step = Math.floor((Math.round(t * 60) / 60) * 30); // whole-frame steps: sub-samples share a state
    const K = 'EMERGING TECHNOLOGIES FOR';
    this.kch.forEach((ch, i) => {
      const real = K[i];
      if (real === ' ') return;
      const appear = 0.08 + i * 0.008, lock = 0.2 + i * 0.013;
      let v = real;
      if (t < appear) v = ' ';
      else if (t < lock) v = pool[Math.floor(hash2(i, step) * pool.length)];
      if (ch._v !== v) { ch.textContent = v; ch._v = v; }
      setO(ch, t < lock ? 0.75 : 1);
    });

    // odometer words
    this.words.forEach((e, i) => {
      const T = 0.5 + i * 0.5;
      const inP = E.outExpo(inv(T, T + 0.26, t));
      const outP = i < 4 ? E.outExpo(inv(T + 0.5, T + 0.76, t)) : 0;
      const y = 262 * (1 - inP) - 262 * outP;
      const on = t >= T - 0.02 && outP < 1;
      show(e, on);
      if (on) setT(e, `translate3d(0, ${y.toFixed(2)}px, 0) scale(${(1 + 0.06 * (1 - inP)).toFixed(4)})`);
    });
    const idx = clamp(Math.floor((t - 0.5) / 0.5), 0, 4);
    const cv = t < 0.5 ? '' : `0${idx + 1} / 05`;
    if (this.count._v !== cv) { this.count.textContent = cv; this.count._v = cv; }
    setO(this.count, anim(t, 0.5, 0.7, 0, 1));
  },
};

// ------------------------------------------------------------------ S2: problems 3.00–6.00
const DUP = 'Duplicated effort', FRAG = 'Fragmented knowledge', INC = 'Inconsistent evaluations';
export const S2 = {
  t0: 3.0, t1: 6.0,
  build(world) {
    this.root = div('scene s2', world);
    this.measure = (txt, cls = 's2-row') => {
      const m = div(cls, this.root, txt);
      const w = m.getBoundingClientRect().width;
      m.remove();
      return w;
    };
    // --- duplicated rows
    this.dupW = this.measure(DUP);
    this.rows = [];
    for (let k = -4; k <= 4; k++) {
      const r = div('s2-row ' + (k === 0 ? 'hero' : 'ol'), this.root);
      r.textContent = k === 0 ? DUP : Array(6).fill(DUP).join('  ');
      this.rows.push({ e: r, k });
    }
    this.gap = this.measure('  ');
    // --- fragmented: every glyph is two pieces (a crack through the x-height) that drift apart
    this.fragWrap = div('abs', this.root);
    this.fragW = this.measure(FRAG);
    this.frags = [];
    const probe = div('s2-row hero', this.root);
    const pch = splitChars(probe, FRAG);
    const base = probe.getBoundingClientRect().left;
    const boxes = pch.map((c) => { const r = c.getBoundingClientRect(); return [r.left - base, r.width]; });
    probe.remove();
    [...FRAG].forEach((ch, i) => {
      if (ch === ' ') return;
      const pieces = [];
      for (const [cls, clip] of [['', 'inset(0 -20px 94px -20px)'], ['', 'inset(78px -20px 0 -20px)']]) {
        const w = div('s2-slice', this.fragWrap, ch);
        const r = div('s2-slice r', this.fragWrap, ch);
        const c = div('s2-slice c', this.fragWrap, ch);
        for (const e of [w, r, c]) e.style.clipPath = clip;
        pieces.push({ w, r, c });
      }
      this.frags.push({ i, x: boxes[i][0], cw: boxes[i][1], pieces });
    });
    // --- inconsistent chars
    this.inc = div('s2-inc', this.root);
    this.incCh = splitChars(this.inc, INC);
    // implosion streaks + core
    this.cv = el('canvas', 'abs', this.root);
    this.cv.width = 1920; this.cv.height = 1080;
    this.c = this.cv.getContext('2d');
    this.dark = div('layer', this.root);
    this.dark.style.background = '#000';
    this.core = div('s2-core', this.root);
    this.line = div('s1-line', this.root);
  },
  mb(t) {
    if (t > 5.4) return 8;
    if (t > 3.55 && t < 3.8) return 8;
    return 4;
  },
  update(t) {
    const c = this.c;
    c.clearRect(0, 0, 1920, 1080);

    // hand-off line from the closing letterbox
    const lp = inv(3.0, 3.16, t);
    show(this.line, lp < 1);
    if (lp < 1) {
      this.line.style.width = '1920px';
      this.line.style.height = lerp(2, 60, E.outCubic(lp)) + 'px';
      setT(this.line, `translate(0px, ${540 - lerp(1, 30, E.outCubic(lp))}px)`);
      setO(this.line, 1 - E.inQuad(lp));
    }

    // ---- 1. Duplicated effort (3.00–3.75): the phrase repeats itself into a wall
    const dOn = t < 3.75;
    this.rows.forEach(({ e, k }) => {
      show(e, dOn);
      if (!dOn) return;
      const y = 540 - 86 + k * 172;
      if (k === 0) {
        const pulse = [3.0, 3.09, 3.18, 3.27, 3.36].reduce((a, T) => a + (t >= T ? 0.035 * Math.exp(-(t - T) * 22) : 0), 0);
        const sc = 1 + 0.12 * (1 - E.outExpo(inv(3.0, 3.3, t))) + pulse;
        setT(e, `translate(${960 - this.dupW / 2}px, ${y}px) scale(${sc.toFixed(4)})`);
        e.style.transformOrigin = `${this.dupW / 2}px 86px`;
        return;
      }
      const T = 3.0 + Math.abs(k) * 0.09;
      const p = E.outExpo(inv(T, T + 0.3, t));
      const dir = k % 2 === 0 ? 1 : -1;
      const period = this.dupW + this.gap;
      const speed = 240 + Math.abs(k) * 40;
      const rush = E.inExpo(inv(3.58, 3.75, t)) * 1600;
      const x = 960 - this.dupW / 2 - period * 2 + dir * ((t - 3.0) * speed + rush) + dir * (1 - p) * -380 + (k % 2 ? period * 0.5 : 0);
      setT(e, `translate(${x.toFixed(2)}px, ${y}px)`);
      setO(e, t < T ? 0 : clamp((t - T) / 0.06) * (1 - 0.6 * Math.abs(k) / 4));
    });

    // ---- 2. Fragmented knowledge (3.75–4.50): legible, then each glyph cracks and the pieces drift apart
    const fOn = t >= 3.75 && t < 4.5;
    show(this.fragWrap, fOn);
    if (fOn) {
      const fx0 = 960 - this.fragW / 2, fy0 = 540 - 86;
      const tf = Math.round(t * 60) / 60;
      const step = Math.floor(tf * 30);
      const jolt = [3.8, 3.87, 3.99, 4.18].some((T) => tf >= T && tf < T + 0.034) ? 1 : 0;
      const sp = E.outQuart(inv(3.84, 4.5, t));
      const n = this.frags.length;
      this.frags.forEach((f, j) => {
        const rel = (f.x + f.cw / 2 - this.fragW / 2) / (this.fragW / 2); // -1..1 across the phrase
        f.pieces.forEach((pc, half) => {
          const hs = half ? 1 : -1;
          const hit = jolt && hash2(j * 2 + half, step) > 0.55 ? (hash2(j + 40, step) - 0.5) * 120 : 0;
          const dx = rel * 150 * sp + (hash(j * 3.1 + half) - 0.5) * 70 * sp + hit;
          const dy = hs * (10 + 34 * hash(j * 5.7 + half)) * sp + (hash(j * 9.1) - 0.5) * 40 * sp;
          const rot = (hash(j * 2.3 + half * 7) - 0.5) * 16 * sp;
          const ab = 9 * (jolt ? 1 : 0) + 3.5 * sp;
          const tf = (ox) => `translate(${(fx0 + f.x + dx + ox).toFixed(2)}px, ${(fy0 + dy).toFixed(2)}px) rotate(${rot.toFixed(2)}deg)`;
          setT(pc.w, tf(0)); setT(pc.r, tf(-ab)); setT(pc.c, tf(ab));
          pc.w.style.transformOrigin = pc.r.style.transformOrigin = pc.c.style.transformOrigin = `${f.cw / 2}px 86px`;
          const ao = Math.min(0.9, (jolt ? 1 : 0) + 0.55 * sp);
          setO(pc.r, ao); setO(pc.c, ao);
        });
      });
    }

    // ---- 3. Inconsistent evaluations (4.50–5.25), then implosion to a single ember (5.25–6.00)
    const iOn = t >= 4.5;
    show(this.inc, iOn);
    if (iOn) {
      const frozen = Math.min(Math.round(t * 60) / 60, 5.25);
      const st = Math.floor(frozen * 15);
      const enter = 1 + 0.1 * (1 - E.outExpo(inv(4.5, 4.75, t)));
      setT(this.inc, `translate(0px, ${540 - 75}px) scale(${enter})`);
      this.inc.style.transformOrigin = '960px 75px';
      this.incCh.forEach((ch, i) => {
        if (INC[i] === ' ') { ch._sc = 1; ch._dy = 0; ch._sk = 0; return; }
        const wght = Math.round(lerp(120, 900, hash2(i, st)));
        if (ch._w !== wght) { ch.style.fontWeight = wght; ch._w = wght; }
        const orange = hash2(i + 50, st) > 0.8;
        const col = orange ? '#FB8B24' : '#FFFFFF';
        if (ch._c !== col) { ch.style.color = col; ch._c = col; }
        ch._sc = lerp(0.8, 1.22, hash2(i + 9, st));
        ch._dy = (hash2(i + 20, st) - 0.5) * 46;
        ch._sk = hash2(i + 70, st) > 0.85 ? -12 : 0;
      });
      if (t < 5.25) {
        this.incCh.forEach((ch) => setT(ch, `translateY(${ch._dy.toFixed(1)}px) scale(${ch._sc.toFixed(3)}) skewX(${ch._sk}deg)`));
        this._pos = null;
      } else {
        if (!this._pos) {
          // measure each glyph once the layout is frozen
          this.incCh.forEach((ch) => setT(ch, `translateY(${ch._dy.toFixed(1)}px) scale(${ch._sc.toFixed(3)}) skewX(${ch._sk}deg)`));
          this._pos = this.incCh.map((ch) => { const r = ch.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; });
        }
        this.incCh.forEach((ch, i) => {
          const [cx, cy] = this._pos[i];
          const d = 0.12 * hash(i * 3.3);
          const p = E.inExpo(inv(5.25 + d, 5.9, t));
          const q = E.inCubic(inv(5.25, 5.9, t));
          const dx = (960 - cx) * p + (hash(i) - 0.5) * 60 * Math.sin(q * 3), dy = (540 - cy) * p;
          setT(ch, `translate(${dx.toFixed(2)}px, ${(ch._dy + dy).toFixed(2)}px) rotate(${((hash(i * 5.1) - 0.5) * 540 * p).toFixed(1)}deg) scale(${(ch._sc * (1 - 0.94 * p)).toFixed(4)}) skewX(${ch._sk}deg)`);
          setO(ch, 1 - Math.pow(p, 3));
        });
      }
    }

    // implosion streaks and core
    const ip = inv(5.2, 5.97, t);
    setO(this.dark, 0.82 * E.inCubic(ip));
    if (ip > 0) {
      c.save();
      c.globalCompositeOperation = 'lighter';
      for (let j = 0; j < 140; j++) {
        const ang = hash(j * 1.7) * TAU;
        const per = 0.26 + hash(j * 2.3) * 0.34;
        const ph = hash(j * 4.9);
        const f = ((t - 5.2) / per + ph) % 1;
        const r = 1250 * Math.pow(1 - f, 1.8);
        const len = (60 + 260 * hash(j * 9.2)) * (1 - f);
        const a = E.inQuad(ip) * clamp(f * 4) * 0.8;
        const x1 = 960 + Math.cos(ang) * r, y1 = 540 + Math.sin(ang) * r;
        const x2 = 960 + Math.cos(ang) * (r + len), y2 = 540 + Math.sin(ang) * (r + len);
        const grd = c.createLinearGradient(x1, y1, x2, y2);
        grd.addColorStop(0, `rgba(255,220,180,${a})`);
        grd.addColorStop(1, 'rgba(255,90,20,0)');
        c.strokeStyle = grd;
        c.lineWidth = 1 + 2.2 * hash(j * 6.1);
        c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke();
      }
      c.restore();
    }
    const cs = lerp(0.02, 1, E.inCubic(inv(5.35, 6.0, t))) * (1 + 0.08 * Math.sin(t * 60));
    show(this.core, t > 5.3);
    setT(this.core, `translate(${960 - 200}px, ${540 - 200}px) scale(${cs.toFixed(4)})`);
    setO(this.core, clamp(inv(5.3, 5.5, t)));
  },
};

// ------------------------------------------------------------------ S3: reveal 6.00–8.00
export const S3 = {
  t0: 6.0, t1: 8.02,
  build(world) {
    this.root = div('scene s3', world);
    this.cam = div('layer', this.root);
    this.glow = div('s3-glow', this.cam);
    this.cv = el('canvas', 'abs', this.cam);
    this.cv.width = 1920; this.cv.height = 1080;
    this.c = this.cv.getContext('2d');
    this.ring = div('s3-ring', this.cam);
    this.ring2 = div('s3-ring', this.cam);
    this.hwrap = div('abs', this.cam);
    this.H = makeH(this.hwrap, 420);
    this.hwrap.style.width = this.H.w + 'px';
    this.hwrap.style.height = this.H.h + 'px';
    this.cv2 = el('canvas', 'abs', this.cam);
    this.cv2.width = 1920; this.cv2.height = 1080;
    this.c2 = this.cv2.getContext('2d');
    this.streak = div('abs', this.cam);
    Object.assign(this.streak.style, { width: '1920px', height: '140px', background: 'radial-gradient(ellipse 50% 50% at 50% 50%, rgba(255,235,210,.95) 0%, rgba(255,150,70,.55) 18%, rgba(255,90,30,.18) 45%, rgba(255,60,20,0) 70%)', mixBlendMode: 'screen' });
    this.wordWrap = div('abs', this.cam);
    Object.assign(this.wordWrap.style, { left: '0px', top: '0px', width: '1920px', height: '210px', overflow: 'visible' });
    this.word = div('s3-word', this.wordWrap);
    this.wch = splitChars(this.word, 'Heyden');
    this.sub = div('s3-sub', this.cam);
    this.sw = splitWords(this.sub, 'A Global Innovation Hub for Emergency Services', false);
  },
  mb(t) { return t > 7.74 ? 8 : t < 6.3 ? 8 : 4; },
  update(t, imgs, api) {
    const lt = t - 6.0;
    const c = this.c;
    c.clearRect(0, 0, 1920, 1080);
    // exit whip
    const wp = E.inExpo(inv(7.76, 8.0, t));
    const push = 1 + 0.035 * E.inOutQuad(inv(6.0, 8.0, t));
    setT(this.cam, `translate(${(-2300 * wp).toFixed(1)}px, 0px) scale(${push.toFixed(4)})`);
    this.cam.style.transformOrigin = '960px 540px';
    this.cam.style.filter = wp > 0.001 ? 'url(#dirX)' : 'none';
    api.blurX(wp > 0.001 ? 60 * Math.min(1, wp * 3) : 0);

    // shockwave rings
    for (const [ring, d, R] of [[this.ring, 0, 1300], [this.ring2, 0.07, 900]]) {
      const p = inv(6.0 + d, 6.75 + d, t);
      const r = lerp(40, R, E.outCubic(p));
      ring.style.width = ring.style.height = r * 2 + 'px';
      ring.style.borderWidth = lerp(8, 1, p) + 'px';
      setT(ring, `translate(${960 - r}px, ${540 - r}px)`);
      setO(ring, p <= 0 || p >= 1 ? 0 : (1 - E.inQuad(p)) * 0.9);
    }
    // warm core glow
    const gs = lerp(0.5, 1, E.outCubic(inv(6.0, 6.6, t)));
    setT(this.glow, `translate(${960 - 700}px, ${540 - 700 - 40}px) scale(${gs.toFixed(4)})`);
    setO(this.glow, lerp(1, 0.7, inv(6.3, 7.5, t)));

    // the mark: lands huge with the hit, springs, then lifts to sit above the wordmark
    const hs = 1.45 - 0.45 * spring(lt, 2.3, 6.5);
    const lift = E.inOutQuart(inv(6.28, 6.72, t));
    const scale = hs * lerp(1, 0.5, lift);
    const y = lerp(540 - 20, 360, lift);
    setT(this.hwrap, `translate(${960 - this.H.w / 2}px, ${y - this.H.h / 2}px) scale(${scale.toFixed(4)})`);
    this.hwrap.style.transformOrigin = '50% 50%';
    const glowA = lerp(0.95, 0.35, E.outCubic(inv(6.0, 6.8, t)));
    this.hwrap.style.filter = `drop-shadow(0 0 ${lerp(70, 34, inv(6, 7, t)).toFixed(1)}px rgba(255,70,20,${glowA.toFixed(3)}))`;

    // sparks
    const { drawBurst, drawEmbers } = api;
    const c2 = this.c2;
    c2.clearRect(0, 0, 1920, 1080);
    const sp = inv(6.0, 6.55, t);
    setT(this.streak, `translate(0px, ${520 - 70}px) scale(${lerp(0.3, 1.6, E.outCubic(sp)).toFixed(3)}, ${lerp(1, 0.25, sp).toFixed(3)})`);
    setO(this.streak, sp >= 1 ? 0 : 1 - E.inQuad(sp));
    drawBurst(c2, lt, { cx: 960, cy: 520, count: 120, seed: 5, speed: [400, 1900], life: [0.5, 1.5], size: [1.2, 3.6] });
    drawEmbers(c, t, { count: 50, seed: 8, speed: [40, 120], size: [0.8, 2.2], alpha: clamp(inv(6.1, 6.8, t)) * 0.8, drift: 60 });

    // wordmark
    this.wordWrap.style.top = '0px';
    setT(this.wordWrap, `translate(0px, ${520}px)`);
    this.wch.forEach((ch, i) => {
      const T = 6.6 + i * 0.03;
      const p = E.outExpo(inv(T, T + 0.55, t));
      setT(ch, `translate3d(0, ${((1 - p) * 120).toFixed(2)}px, 0)`);
      setO(ch, clamp(p * 1.4));
    });
    // positioning line
    setT(this.sub, `translate(0px, ${740}px)`);
    this.sw.forEach((w, i) => {
      const T = 6.9 + i * 0.05;
      const p = E.outCubic(inv(T, T + 0.4, t));
      setT(w, `translate3d(0, ${(1 - p) * 26}px, 0)`);
      setO(w, p);
    });
  },
};
