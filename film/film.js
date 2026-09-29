import { clamp, lerp, inv, E, hash, fbm, div, el, show, setT, setO } from './lib.js';
import { S1, S2, S3 } from './scenes/intro.js';
import { PR } from './scenes/product.js';
import { S8, S9 } from './scenes/outro.js';

export const W = 1920, H = 1080;
const FOOT_FPS = 30000 / 1001;
const stage = document.getElementById('stage');

// ---------- footage: JPEG sequences extracted from Heyden's homepage loop by extract-footage.sh ----------
const COUNTS = { fire: 90, crop: 76, flood: 75, smoke: 76, heli: 76, hose: 75, crews: 120 };
const cache = new Map();
function frame(name, idx) {
  idx = Math.max(0, Math.min(COUNTS[name] - 1, idx | 0));
  const key = name + idx;
  if (!cache.has(key)) {
    const img = new Image();
    img.src = `/footage/${name}/${String(idx).padStart(4, '0')}.jpg`;
    const p = img.decode().then(() => img);
    cache.set(key, { img, p });
    if (cache.size > 48) cache.delete(cache.keys().next().value);
  }
  return cache.get(key);
}
export const footIndex = (sec) => Math.floor(sec * FOOT_FPS + 1e-6);

// ---------- embers: deterministic particles ----------
export function drawEmbers(c, t, o = {}) {
  const { count = 60, seed = 1, x = 0, y = 0, w = W, h = H, speed = [50, 170], size = [0.8, 2.6], alpha = 1, drift = 40, hot = '255,214,160', cool = '255,112,28' } = o;
  if (alpha <= 0.001) return;
  c.save();
  c.globalCompositeOperation = 'lighter';
  const life = h + 160;
  for (let i = 0; i < count; i++) {
    const h1 = hash(i * 3.17 + seed * 11.3), h2 = hash(i * 7.71 + seed * 5.1), h3 = hash(i * 1.37 + seed * 2.9), h4 = hash(i * 9.13 + seed * 7.7);
    const sp = lerp(speed[0], speed[1], h2);
    const py = y + h + 80 - ((t * sp + h3 * life) % life);
    const px = x + h1 * w + Math.sin(t * (0.7 + h4 * 1.6) + h4 * 12) * drift + fbm(t * 0.6 + i, seed) * drift;
    const r = lerp(size[0], size[1], h4 * h4);
    const fl = 0.55 + 0.45 * Math.sin(t * (8 + h1 * 13) + h2 * 30);
    const a = alpha * fl * clamp((y + h + 80 - py) / 200) * clamp((py - y + 40) / 220);
    if (a <= 0.004) continue;
    const g = c.createRadialGradient(px, py, 0, px, py, r * 6);
    g.addColorStop(0, `rgba(${hot},${0.95 * a})`);
    g.addColorStop(0.22, `rgba(${cool},${0.55 * a})`);
    g.addColorStop(1, 'rgba(255,70,0,0)');
    c.fillStyle = g;
    c.fillRect(px - r * 6, py - r * 6, r * 12, r * 12);
  }
  c.restore();
}

// burst of sparks from a point; age in seconds
export function drawBurst(c, age, o = {}) {
  const { cx = W / 2, cy = H / 2, count = 90, seed = 3, speed = [300, 1400], life = [0.6, 1.6], size = [1, 3.4], alpha = 1 } = o;
  if (age < 0) return;
  c.save();
  c.globalCompositeOperation = 'lighter';
  for (let i = 0; i < count; i++) {
    const h1 = hash(i * 4.1 + seed), h2 = hash(i * 8.3 + seed * 3), h3 = hash(i * 2.7 + seed * 7), h4 = hash(i * 5.9 + seed * 9);
    const L = lerp(life[0], life[1], h3);
    if (age > L) continue;
    const ang = h1 * Math.PI * 2;
    const v0 = lerp(speed[0], speed[1], h2 * h2);
    const k = 3.2; // drag
    const dist = (v0 / k) * (1 - Math.exp(-k * age));
    const px = cx + Math.cos(ang) * dist + Math.sin(age * 3 + i) * 6;
    const py = cy + Math.sin(ang) * dist * 0.8 - 60 * age * age;
    const r = lerp(size[0], size[1], h4);
    const a = alpha * Math.pow(1 - age / L, 1.4);
    const vx = Math.cos(ang) * v0 * Math.exp(-k * age), vy = Math.sin(ang) * v0 * 0.8 * Math.exp(-k * age);
    const sl = Math.min(90, Math.hypot(vx, vy) * 0.03);
    c.strokeStyle = `rgba(255,${Math.round(150 + 80 * h4)},${Math.round(70 + 90 * h4)},${a})`;
    c.lineWidth = r;
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(px, py);
    c.lineTo(px - (vx / (Math.hypot(vx, vy) + 1e-6)) * sl, py - (vy / (Math.hypot(vx, vy) + 1e-6)) * sl);
    c.stroke();
  }
  c.restore();
}

// ---------- global impacts: flash + camera shake ----------
// v3: the intro (0–8) is v1's; the product section (7.86–42) is new; the outro is v1's, 20 s later. 50 s in all.
export const OUTRO_SHIFT = 20;
export const IMPACTS = [
  { t: 0.5, shake: 3, flash: 0.0 }, { t: 1.0, shake: 3, flash: 0 }, { t: 1.5, shake: 3, flash: 0 }, { t: 2.0, shake: 3, flash: 0 }, { t: 2.5, shake: 3, flash: 0 },
  { t: 3.0, shake: 6, flash: 0.25 },
  { t: 6.0, shake: 20, flash: 1.0 },
  { t: 8.0, shake: 7, flash: 0 },
  { t: 22.1 + OUTRO_SHIFT, shake: 3, flash: 0 },
  { t: 24.0 + OUTRO_SHIFT, shake: 8, flash: 0.2 },
  { t: 26.0 + OUTRO_SHIFT, shake: 18, flash: 0.85 },
];

// run a v1 scene unchanged, later on the timeline
function shifted(S, dt) {
  return {
    get root() { return S.root; },
    t0: S.t0 + dt, t1: S.t1 + dt,
    needs: S.needs ? (t, api) => S.needs.call(S, t - dt, api) : undefined,
    build: (w, api) => S.build.call(S, w, api),
    mb: S.mb ? (t) => S.mb.call(S, t - dt) : undefined,
    update: (t, imgs, api) => S.update.call(S, t - dt, imgs, api),
  };
}

const world = div('layer', stage);
const flash = div('layer', stage); flash.id = 'flash';
const vig = div('layer', stage); vig.id = 'vignette';

const blur = { x: 0, y: 0 };
const api = { W, H, frame, footIndex, drawEmbers, drawBurst, stage, world,
  blurX: (v) => { blur.x = Math.max(blur.x, v); }, blurY: (v) => { blur.y = Math.max(blur.y, v); } };
const bx = document.getElementById('dirXb'), by = document.getElementById('dirYb');
const scenes = [S1, S2, S3, PR, shifted(S8, OUTRO_SHIFT), shifted(S9, OUTRO_SHIFT)];

function globalFx(t) {
  let sx = 0, sy = 0, fl = 0;
  for (const im of IMPACTS) {
    const a = t - im.t;
    if (a < 0 || a > 1.2) continue;
    const env = Math.exp(-a * 9);
    sx += fbm(t * 38 + im.t, 3) * im.shake * env;
    sy += fbm(t * 41 + im.t, 9) * im.shake * env;
    fl = Math.max(fl, im.flash * Math.exp(-a * 7.5));
  }
  setT(world, `translate3d(${sx.toFixed(2)}px,${sy.toFixed(2)}px,0)`);
  setO(flash, fl);
  flash.style.background = `radial-gradient(ellipse 70% 70% at 50% 50%, rgba(255,240,225,${Math.min(1, fl * 1.1)}) 0%, rgba(255,150,70,${fl * 0.8}) 35%, rgba(255,90,30,${fl * 0.45}) 70%, rgba(255,60,20,${fl * 0.25}) 100%)`;
}

window.__render = async (t) => {
  const active = scenes.filter((s) => t >= s.t0 && t < s.t1);
  const needs = active.flatMap((s) => (s.needs ? s.needs(t) : []));
  const imgs = {};
  await Promise.all(needs.map(async (n) => { imgs[n.key || n.name] = await frame(n.name, n.idx).p; }));
  blur.x = 0; blur.y = 0;
  for (const s of scenes) {
    const on = t >= s.t0 && t < s.t1;
    show(s.root, on);
    if (on) s.update(t, imgs, api);
  }
  bx.setAttribute('stdDeviation', `${blur.x.toFixed(2)} 0`);
  by.setAttribute('stdDeviation', `0 ${blur.y.toFixed(2)}`);
  globalFx(t);
};

window.__exportMotion = () => PR.exportMotion();
window.__TL = () => PR.TL;
window.__geo = () => ({ geo: PR.geo, nav: PR.nav, stageX: PR.stageX });

// sub-frame count for motion blur
window.__mb = (t) => {
  let n = 4;
  for (const s of scenes) if (t >= s.t0 && t < s.t1 && s.mb) n = Math.max(n, s.mb(t));
  return n;
};

window.__ready = (async () => {
  await document.fonts.load('700 100px Inter');
  await document.fonts.load('400 100px Inter');
  await document.fonts.ready;
  const geo = await fetch('vendor/land-110m.json').then((r) => r.json());
  api.land = geo;
  for (const s of scenes) await s.build(world, api);
  // warm the footage cache for the opening
  await frame('fire', 10).p;
  await window.__render(0);
  return true;
})();
