// Product section, 7.86–32.00: one continuous move through the Heyden platform.
// A single app window lives in 3D space; a camera (solved per frame so a chosen UI point lands on a chosen screen
// point) flies over it while the app is really used: the pipeline advances, a partner agency joins, a proposal is
// assessed, a project is aligned to strategy, Ask Heyden researches the Commons. Verb titles are open type in the
// same space. Ends on the globe with a line from Heyden's own copy, handing off to the roles scene at 32.0.
// Key events sit on the 120 BPM grid the intro already uses (beat = 0.5 s) so the score can land on them.
import { clamp, lerp, inv, E, hash, TAU, div, el, splitChars, setT, setO, show, spline, setTxt, setW, bezier } from '../lib.js';
import { buildPlatform, navGeometry, WIN_W, WIN_H, TOP_H, QA_TEXT, ASK_Q } from '../platform.js';

const PERSP = 2000, D2R = Math.PI / 180;

// ------------------------------------------------------------------ timeline
export const TL = {
  t0: 7.86, t1: 42.0,
  // chapter 1 — Collaborate (Projects)
  land: 8.55, v1In: 8.12, stageMove: 9.6, v1Out: 11.1, invite: 12.3, partner: 12.5, extIn: 13.5, nav1: 15.5,
  // chapter 2 — Innovate (Quick Assessment)
  v2In: 16.1, v2Out: 18.9, focusIn: 19.45, typeA: 19.6, typeB: 21.4, plus: 21.75, attach: 21.85, assess: 22.45, brief: 22.95, badges: 24.1, nav2: 25.2,
  // chapter 3 — Strategise (Strategy Hub)
  v3In: 25.9, creep: 27.35, v3Out: 28.7, align: 29.55, pick: 30.15, rowUpd: 30.35, tilesUpd: 31.15, nav3: 32.6,
  // chapter 4 — Solve (Commons)
  v4In: 33.25, v4Out: 36.05, searchClick: 36.5, typeC: 36.6, typeD: 37.85, ask: 38.5, curated: 39.15, recede: 40.15,
  world: 40.4, push: 41.55,
};

// the line over the globe ('The world's at your fingertips.' didn't say Heyden). Options, all Heyden's copy:
export const WORLD_LINES = {
  hub: ['A Global Innovation Hub', 'for Emergency Services.'],        // positioning line (home page, logo scene)
  scan: ['Scan the market, decide faster.'],                           // agency tile, home page
  agency: ['Share across agencies. Scan the market.', 'Decide faster.'], // agency role line, home page
  share: ['Share work across agencies.'],                              // agency tile, home page
};
export const WORLD_LINE = 'hub';

// ------------------------------------------------------------------ camera
// pose: which window point (fx, fy) sits at which screen point (sx, sy), at scale s, rotated rx/ry (deg), depth z.
const PK = ['fx', 'fy', 'sx', 'sy', 's', 'rx', 'ry', 'rz', 'z'];
const pose = (t, fx, fy, sx, sy, s, rx, ry, z = 0, e = null, rz = 0) => ({ t, fx, fy, sx, sy, s, rx, ry, rz, z, e });
function camPath(poses) {
  const tr = {};
  for (const p of PK) {
    tr[p] = spline(poses.map((q, i) => {
      const edge = q.e || (poses[i + 1] && poses[i + 1].e);
      return [q.t, q[p], edge ? 0 : null];
    }));
  }
  return (t) => {
    for (let i = 1; i < poses.length; i++) {
      const a = poses[i - 1], b = poses[i];
      if (b.e && t >= a.t && t < b.t) {
        const u = b.e(inv(a.t, b.t, t));
        const o = {};
        for (const p of PK) o[p] = lerp(a[p], b[p], u);
        return o;
      }
    }
    const o = {};
    for (const p of PK) o[p] = tr[p](t);
    return o;
  };
}
// rotate a window-local offset (already scaled) the way CSS does for translate·rotateX·rotateY·rotateZ·scale
function rot(c, x, y) {
  let z = 0, a = c.rz * D2R;
  [x, y] = [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)];
  a = c.ry * D2R;
  [x, z] = [x * Math.cos(a) + z * Math.sin(a), -x * Math.sin(a) + z * Math.cos(a)];
  a = c.rx * D2R;
  [y, z] = [y * Math.cos(a) - z * Math.sin(a), y * Math.sin(a) + z * Math.cos(a)];
  return [x, y, z];
}
function solve(c) {
  const [x, y, z] = rot(c, (c.fx - WIN_W / 2) * c.s, (c.fy - WIN_H / 2) * c.s);
  const k = PERSP / (PERSP - (z + c.z));
  return { Tx: (c.sx - 960) / k - x, Ty: (c.sy - 540) / k - y, Tz: c.z };
}
function project(c, T, px, py) {
  const [x, y, z] = rot(c, (px - WIN_W / 2) * c.s, (py - WIN_H / 2) * c.s);
  const k = PERSP / (PERSP - (z + T.Tz));
  return [960 + (x + T.Tx) * k, 540 + (y + T.Ty) * k, k];
}

// Camera, part 1: authored 3D poses for the arrival, the titles, the crane and the recede. While the app is being used
// the camera is in "screen mode" (part 2, precomputed in PR.build once the UI is measured) and these poses are held
// out of sight, already waiting at the next title's framing.
const SIDE_R = (d = 0) => [820 + 20 * d, 480 + 6 * d, 1340 - 40 * d, 560 - 8 * d, 0.74 + 0.06 * d, 6 - 1.5 * d, -17 + 5 * d];
const SIDE_L = (d = 0) => [780 - 20 * d, 470, 585 + 27 * d, 560 - 8 * d, 0.74 + 0.06 * d, 5 - 1 * d, 17 - 4.5 * d];
const CAM3D = camPath([
  pose(TL.t0, 800, 500, 2330, 600, 0.80, 8, -38, -300),
  pose(TL.land, ...SIDE_R(0), 0, E.outExpoN),
  pose(TL.v1Out, ...SIDE_R(1)),
  pose(TL.v1Out + 0.7, ...SIDE_R(1)),
  pose(TL.nav1 - 0.6, ...SIDE_R(1)),
  pose(TL.nav1 + 0.1, ...SIDE_L(0)),
  pose(TL.v2Out, ...SIDE_L(1)),
  pose(TL.v2Out + 0.7, ...SIDE_L(1)),
  pose(TL.nav2 - 0.5, ...SIDE_L(1)),
  pose(TL.nav2 + 0.1, 800, 560, 960, 792, 0.76, 40, 0, -100),
  pose(TL.nav2 + 0.8, 800, 560, 960, 792, 0.76, 40, 0, -100),
  pose(TL.v3Out - 0.4, 800, 540, 960, 764, 0.82, 32, 0, -60),
  pose(TL.v3Out, 800, 500, 960, 660, 0.88, 22, 0, -30),
  pose(TL.v3Out + 0.7, 800, 500, 960, 660, 0.88, 22, 0, -30),
  pose(TL.nav3 - 0.5, 800, 500, 960, 660, 0.88, 22, 0, -30),
  pose(TL.nav3 + 0.1, ...SIDE_R(0)),
  pose(TL.v4Out, ...SIDE_R(1)),
  pose(TL.v4Out + 0.7, ...SIDE_R(1)),
  pose(TL.recede - 0.6, ...SIDE_R(1)),
  pose(TL.recede - 0.05, 800, 540, 960, 560, 1.0, 1.5, 0),
  pose(TL.recede + 0.65, 800, 500, 960, 820, 0.40, 58, 0, -900),
  pose(TL.t1, 800, 500, 960, 940, 0.34, 64, 0, -1200),
]);
// how much the screen camera is in charge: 0 during the titles, 1 while the app is being used
const W_KEYS = [
  [TL.t0, 0], [TL.v1Out, 0], [TL.v1Out + 0.65, 1], [TL.nav1 + 0.1, 1], [TL.nav1 + 0.8, 0],
  [TL.v2Out, 0], [TL.v2Out + 0.6, 1], [TL.nav2 + 0.1, 1], [TL.nav2 + 0.8, 0],
  [TL.v3Out, 0], [TL.v3Out + 0.6, 1], [TL.nav3 + 0.1, 1], [TL.nav3 + 0.8, 0],
  [TL.v4Out, 0], [TL.v4Out + 0.6, 1], [TL.recede, 1], [TL.recede + 0.45, 0], [TL.t1, 0],
];
function wAt(t) {
  for (let i = 1; i < W_KEYS.length; i++) {
    const [a, va] = W_KEYS[i - 1], [b, vb] = W_KEYS[i];
    if (t < b) return lerp(va, vb, E.inOutCubic(inv(a, b, t)));
  }
  return 0;
}
// Camera, part 2 — the screen camera. While the app is being used the camera is directed like a good screen-recording
// edit: it frames the area where the next thing happens, holds still while it happens (a still frame is a sharp,
// readable frame), then makes one eased move to the next area. Each key is [t, fx, fy, s]: the window point at the
// centre of the screen and the scale. Between two keys the camera eases in and out; equal keys hold.
const EDGE = 40; // how far past the window's edge a framing may look
const frame = (fx, fy, s) => {
  const hw = 960 / s, hh = 540 / s;
  return [clamp(fx, hw - EDGE, WIN_W - hw + EDGE), clamp(fy, hh - EDGE, WIN_H - hh + EDGE), Math.log(s)];
};
const SHOTS = [
  // Collaborate: the Workspace panel (Invite your team, a partner agency joins) → their project arrives → up to the nav
  [TL.v1Out, ...frame(1060, 713, 1.6)],
  [TL.partner + 0.5, ...frame(1060, 713, 1.68)],
  [TL.extIn + 0.15, ...frame(420, 713, 1.68)],
  [TL.nav1 - 0.75, ...frame(430, 713, 1.72)],
  [TL.nav1 - 0.25, ...frame(560, 300, 1.65)],
  [TL.v2Out, ...frame(560, 300, 1.6)],
  // Innovate: the box (click in, type, attach, Assess) → the brief as it lands → the TRL badges → out to the nav
  [TL.assess - 0.1, ...frame(575, 305, 1.72)],
  [TL.brief + 0.2, ...frame(600, 700, 1.45)],
  [TL.badges - 0.4, ...frame(610, 700, 1.5)],
  [TL.badges, ...frame(760, 790, 1.85)],
  [TL.nav2 - 0.7, ...frame(760, 790, 1.88)],
  [TL.nav2 - 0.05, ...frame(700, 380, 1.35)],
  [TL.v3Out, ...frame(800, 625, 1.3)],
  // Strategise: the gaps (Align project, pick the project, the row turns covered) → up to the tiles as they update
  [TL.tilesUpd - 0.45, ...frame(800, 640, 1.33)],
  [TL.tilesUpd - 0.05, ...frame(800, 400, 1.3)],
  [TL.nav3 + 0.1, ...frame(800, 390, 1.32)],
  [TL.v4Out, ...frame(600, 300, 1.6)],
  // Solve: the question being typed → across to Ask Heyden → back to see its curated view
  [TL.typeD + 0.05, ...frame(610, 300, 1.66)],
  [TL.ask - 0.1, ...frame(1040, 300, 1.66)],
  [TL.ask + 0.25, ...frame(1040, 300, 1.66)],
  [TL.curated + 0.1, ...frame(800, 590, 1.2)],
  [TL.t1, ...frame(800, 590, 1.24)],
];
const MOVE = bezier(0.4, 0, 0.2, 1); // the standard ease: a gentle start, a soft arrival, no lurch in between
// piecewise eased track through keys [t, ...values]
function track(keys, ease) {
  return (t) => {
    if (t <= keys[0][0]) return keys[0].slice(1);
    for (let i = 1; i < keys.length; i++) {
      const a = keys[i - 1], b = keys[i];
      if (t < b[0]) {
        const u = ease(inv(a[0], b[0], t));
        return a.slice(1).map((v, k) => lerp(v, b[k + 1], u));
      }
    }
    return keys[keys.length - 1].slice(1);
  };
}
const SHOT = track(SHOTS, MOVE);
function shotAt(t) {
  const [fx, fy, ls] = SHOT(t);
  return { fx, fy, s: Math.exp(ls) };
}
function CAM(t) {
  const a = CAM3D(t);
  const w = wAt(t);
  if (w <= 0) return a;
  const b = shotAt(t);
  const S = { fx: b.fx, fy: b.fy, sx: 960, sy: 540, s: b.s, rx: 0, ry: 0, rz: 0, z: 0 };
  const o = {};
  for (const p of PK) o[p] = lerp(a[p], S[p], w);
  return o;
}

// ------------------------------------------------------------------ verb titles
const VERBS = [
  { idx: '01', verb: 'Collaborate', lines: [['Individual and inter-agency', 0], ['data sharing.', 0], ['Skip the duplicated efforts.', 1]], x: 104, y: 344, align: 'l', tin: TL.v1In, tout: TL.v1Out },
  { idx: '02', verb: 'Innovate', lines: [['Quickly assess the viability', 0], ['of proposals.', 0], ['No more missed opportunities.', 1]], x: 1210, y: 336, align: 'l', tin: TL.v2In, tout: TL.v2Out },
  { idx: '03', verb: 'Strategise', lines: [['Ensure alignment between projects and strategy.', 0], ['Kill scope creep.', 1]], x: 960 - 600, y: 70, align: 'c', w: 1200, tin: TL.v3In, tout: TL.v3Out },
  { idx: '04', verb: 'Solve', lines: [['Find solutions to your trickiest', 0], ['problems through the Commons.', 1]], x: 104, y: 372, align: 'l', tin: TL.v4In, tout: TL.v4Out },
];
function buildVerb(parent, o) {
  const b = div('vb' + (o.align === 'c' ? ' c' : ''), parent);
  if (o.w) b.style.width = o.w + 'px';
  const k = div('vb-k', b);
  const kn = el('span', '', k, o.idx);
  el('span', 'm', k, '  /  04');
  const vm = el('span', 'vb-vm', b);
  const v = div('vb-v', vm);
  const chars = splitChars(v, o.verb);
  const t = div('vb-t', b);
  const words = [];
  o.lines.forEach(([line, hl], li) => {
    if (li > 0) el('br', '', t);
    line.split(' ').forEach((w, wi, arr) => {
      const m = el('span', 'wmask', t);
      const inner = el('span', 'wi' + (hl ? ' hl' : ''), m, w);
      if (wi < arr.length - 1) t.appendChild(document.createTextNode(' '));
      words.push(inner);
    });
  });
  return { ...o, b, k, kn, chars, words };
}
function animVerb(V, t, dir) {
  const on = t > V.tin - 0.05 && t < V.tout + 0.45;
  show(V.b, on);
  if (!on) return;
  // exits are quick and finish before the camera sweeps the window across where the type was
  const outP = E.inCubic(inv(V.tout, V.tout + 0.34, t));
  setT(V.b, `translate3d(${(V.x - dir * 60 * outP).toFixed(2)}px, ${V.y}px, 0)`);
  setO(V.b, 1 - E.inQuad(inv(V.tout + 0.06, V.tout + 0.36, t)));
  // index
  setO(V.k, clamp(inv(V.tin, V.tin + 0.25, t)));
  setT(V.k, `translate3d(${((1 - E.outExpo(inv(V.tin, V.tin + 0.6, t))) * -24 * (V.align === 'c' ? 0 : 1)).toFixed(2)}px, 0, 0)`);
  // verb: characters rise out of a mask
  V.chars.forEach((c, i) => {
    const T = V.tin + 0.08 + i * 0.026;
    const p = E.outExpo(inv(T, T + 0.7, t));
    const q = E.inCubic(inv(V.tout + i * 0.008, V.tout + 0.24 + i * 0.008, t));
    setT(c, `translate3d(0, ${((1 - p) * 112 - q * 112).toFixed(2)}%, 0)`);
  });
  // tagline: words rise in reading order
  V.words.forEach((w, i) => {
    const T = V.tin + 0.3 + i * 0.032;
    const p = E.outExpo(inv(T, T + 0.62, t));
    const q = E.inCubic(inv(V.tout + 0.02 + i * 0.005, V.tout + 0.26 + i * 0.005, t));
    setT(w, `translate3d(0, ${((1 - p) * 110 - q * 110).toFixed(2)}%, 0)`);
  });
}

// ------------------------------------------------------------------ globe (land dots from Natural Earth 110m)
const PINS = [
  [-35.3, 149.1], [-27.5, 153.0], [-33.9, 151.2], [-37.8, 144.9], [-31.9, 115.9], [-26.4, 153.1],
  [38.6, -121.5], [34.0, -111.9], [32.4, -86.3], [64.8, -147.7], [34.7, -92.3], [36.8, -119.8],
  [53.5, -113.5], [49.3, -123.1], [51.0, -114.1], [45.4, -75.7],
];
const HOME = [-26.4, 153.1]; // Peregian Beach QLD, where Firetech Labs is based
function landPoints(land) {
  const fc = topojson.feature(land, land.objects.land);
  const W = 1440, Hh = 720;
  const cv = document.createElement('canvas'); cv.width = W; cv.height = Hh;
  const c = cv.getContext('2d');
  c.fillStyle = '#fff';
  const proj = ([lon, lat]) => [((lon + 180) / 360) * W, ((90 - lat) / 180) * Hh];
  for (const f of fc.features) {
    const polys = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates;
    for (const poly of polys) {
      c.beginPath();
      for (const ring of poly) {
        let prev = null;
        ring.forEach((pt, i) => {
          const [x, y] = proj(pt);
          if (i === 0 || (prev && Math.abs(x - prev[0]) > W / 2)) c.moveTo(x, y); else c.lineTo(x, y);
          prev = [x, y];
        });
      }
      c.fill('evenodd');
    }
  }
  const data = c.getImageData(0, 0, W, Hh).data;
  const N = 70000, pts = [];
  const ga = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < N; i++) {
    const y = 1 - (i / (N - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const th = ga * i;
    const lat = Math.asin(y) * 180 / Math.PI;
    const lon = (Math.atan2(Math.sin(th) * r, Math.cos(th) * r) * 180) / Math.PI;
    const [px, py] = proj([lon, lat]);
    if (data[(Math.min(Hh - 1, Math.floor(py)) * W + Math.min(W - 1, Math.floor(px))) * 4] > 128) pts.push([lat, lon]);
  }
  return pts;
}
function drawGlobe(g, t, pts, cx, cy, R, lon0, lat0, alpha, T0) {
  const cl0 = Math.cos(lat0 * D2R), sl0 = Math.sin(lat0 * D2R);
  const project3 = (lat, lon) => {
    const la = lat * D2R, lo = (lon - lon0) * D2R;
    const cosc = sl0 * Math.sin(la) + cl0 * Math.cos(la) * Math.cos(lo);
    const x = Math.cos(la) * Math.sin(lo);
    const y = cl0 * Math.sin(la) - sl0 * Math.cos(la) * Math.cos(lo);
    return [cx + x * R, cy - y * R, cosc];
  };
  const atm = g.createRadialGradient(cx, cy, R * 0.9, cx, cy, R * 1.35);
  atm.addColorStop(0, `rgba(251,139,36,${0.16 * alpha})`);
  atm.addColorStop(1, 'rgba(251,139,36,0)');
  g.fillStyle = atm;
  g.beginPath(); g.arc(cx, cy, R * 1.35, 0, TAU); g.fill();
  const body = g.createRadialGradient(cx - R * 0.3, cy - R * 0.35, R * 0.1, cx, cy, R);
  body.addColorStop(0, `rgba(34,30,27,${alpha})`);
  body.addColorStop(1, `rgba(14,13,12,${alpha})`);
  g.fillStyle = body;
  g.beginPath(); g.arc(cx, cy, R, 0, TAU); g.fill();
  g.strokeStyle = `rgba(255,255,255,${0.1 * alpha})`;
  g.lineWidth = 1;
  g.stroke();
  const ds = Math.max(0.8, R / 380);
  for (const [lat, lon] of pts) {
    const [x, y, z] = project3(lat, lon);
    if (z <= 0.02) continue;
    const lx = (x - cx) / R, ly = (y - cy) / R;
    const lit = clamp(0.55 + 0.45 * (-0.5 * lx - 0.6 * ly + 0.62 * z));
    const a = alpha * (0.18 + 0.82 * z) * lit;
    g.fillStyle = `rgba(242,232,220,${a.toFixed(3)})`;
    g.fillRect(x - ds, y - ds, ds * 2, ds * 2);
  }
  const rim = g.createRadialGradient(cx, cy, R * 0.82, cx, cy, R * 1.01);
  rim.addColorStop(0, 'rgba(251,139,36,0)');
  rim.addColorStop(1, `rgba(251,139,36,${(0.22 * alpha).toFixed(3)})`);
  g.fillStyle = rim;
  g.beginPath(); g.arc(cx, cy, R, 0, TAU); g.fill();
  const [hx, hy] = project3(HOME[0], HOME[1]);
  g.save();
  g.globalCompositeOperation = 'lighter';
  PINS.forEach(([lat, lon], i) => {
    const T = T0 + i * 0.045;
    const p = E.outCubic(inv(T, T + 0.55, t));
    if (p <= 0) return;
    const [px, py, pz] = project3(lat, lon);
    if (pz > 0.02 && i !== 5) {
      const mx = (hx + px) / 2, my = (hy + py) / 2;
      const dx = mx - cx, dy = my - cy, dl = Math.hypot(dx, dy) + 1e-6;
      const lift = Math.hypot(px - hx, py - hy) * 0.35;
      const qx = mx + (dx / dl) * lift, qy = my + (dy / dl) * lift;
      g.strokeStyle = `rgba(251,139,36,${(0.55 * alpha).toFixed(3)})`;
      g.lineWidth = 1.6;
      g.beginPath();
      const steps = 40;
      for (let s = 0; s <= steps * p; s++) {
        const u = s / steps;
        const x = (1 - u) * (1 - u) * hx + 2 * (1 - u) * u * qx + u * u * px;
        const y = (1 - u) * (1 - u) * hy + 2 * (1 - u) * u * qy + u * u * py;
        if (s === 0) g.moveTo(x, y); else g.lineTo(x, y);
      }
      g.stroke();
    }
    if (pz > 0) {
      const pulse = (t - T) > 0 ? ((t - T) * 1.4) % 1 : 0;
      g.strokeStyle = `rgba(251,139,36,${((1 - pulse) * 0.8 * alpha * pz).toFixed(3)})`;
      g.lineWidth = 2;
      g.beginPath(); g.arc(px, py, 4 + 22 * pulse, 0, TAU); g.stroke();
      const gl = g.createRadialGradient(px, py, 0, px, py, 16);
      gl.addColorStop(0, `rgba(255,220,170,${(alpha * pz * p).toFixed(3)})`);
      gl.addColorStop(0.3, `rgba(251,139,36,${(0.8 * alpha * pz * p).toFixed(3)})`);
      gl.addColorStop(1, 'rgba(251,139,36,0)');
      g.fillStyle = gl;
      g.beginPath(); g.arc(px, py, 16, 0, TAU); g.fill();
    }
  });
  g.restore();
}

// ------------------------------------------------------------------ helpers
const settle = (e, t, T, d = 0.5, dy = 16) => {
  const p = E.hey(inv(T, T + d, t));
  setT(e, `translate3d(0, ${((1 - p) * dy).toFixed(2)}px, 0)`);
  setO(e, clamp(inv(T, T + d * 0.45, t)));
  return p;
};
const pop = (e, t, T, d = 0.42, from = 0.86) => {
  const p = E.outBackSoft(inv(T, T + d, t));
  setT(e, `scale(${lerp(from, 1, p).toFixed(4)})`);
  setO(e, clamp(inv(T, T + d * 0.4, t)));
  return p;
};
const typed = (s, t, a, b) => s.slice(0, Math.floor(s.length * clamp((t - a) / (b - a)) + 1e-6));

// ------------------------------------------------------------------ scene
export const PR = {
  t0: TL.t0, t1: TL.t1, TL,
  build(world, api) {
    this.root = div('scene', world);
    div('pr-bg', this.root);
    this.glow = div('pr-glow', this.root);
    // titles sit behind the window: when the camera swings the window across, it wipes the type
    this.back = div('layer', this.root);
    this.V = VERBS.map((o) => buildVerb(this.back, o));
    this.view = div('pr-view', this.root);
    this.winpos = div('pr-winpos', this.view);
    this.P = buildPlatform(this.winpos);
    this.creep = this.V[2].words[this.V[2].words.length - 1];
    this.gcv = el('canvas', 'abs', this.root);
    const dpr = window.devicePixelRatio || 1; // a sharp globe when the film is rendered at 2x
    this.gcv.width = 1920 * dpr; this.gcv.height = 1080 * dpr;
    this.gcv.style.width = '1920px'; this.gcv.style.height = '1080px';
    this.g = this.gcv.getContext('2d');
    this.g.scale(dpr, dpr);
    this.world = div('bigline', this.root);
    this.worldLines = WORLD_LINES[(typeof window !== 'undefined' && window.__worldLine) || WORLD_LINE];
    if (this.worldLines.length > 1) { this.world.style.fontSize = '84px'; this.world.style.lineHeight = '1.1'; }
    this.worldW = [];
    this.worldLines.forEach((line, li) => {
      if (li > 0) el('br', '', this.world);
      line.split(' ').forEach((w, i, arr) => {
        const m = el('span', 'wmask', this.world);
        this.worldW.push(el('span', 'wi', m, w));
        if (i < arr.length - 1) this.world.appendChild(document.createTextNode(' '));
      });
    });
    this.pts = landPoints(api.land);
    // geometry in window space, measured once with the window untransformed
    const P = this.P;
    this.nav = navGeometry(P);
    const base = P.win.getBoundingClientRect();
    const R = (e) => { const r = e.getBoundingClientRect(); return { x: r.left - base.left, y: r.top - base.top, w: r.width, h: r.height, cx: r.left - base.left + r.width / 2, cy: r.top - base.top + r.height / 2 }; };
    for (const k in P.pages) P.pages[k].page.style.display = '';
    const pj = P.pages.projects, qa = P.pages.qa, sh = P.pages.strategy, cm = P.pages.commons;
    this.geo = {
      qaInput: R(qa.shell), qaBtn: R(qa.btn), qaPlus: R(qa.plus),
      alignBtn: R(sh.gaps[0].btn), opt0: null, pop: null,
      cmSearch: R(cm.search), cmAsk: R(cm.ask),
      lane4: R(pj.lanes[3]), lane3: R(pj.lanes[2]),
    };
    sh.pop.style.left = (1556 - 22 - 16 - 330) + 'px'; sh.pop.style.top = (600 + 54 + 66) + 'px';
    this.geo.opt0 = R(sh.popOpts[0]);
    this.stageX = pj.stages.map((s) => s.cx);
    this.geo.invite = R(pj.invite);
    this.geo.partnerRow = R(pj.orgs[1]);
    this.geo.ext = R(pj.ext.c);
    this.geo.cell6 = R(qa.cells[6]);
    this.geo.trl = R(qa.panels[0].p); this.geo.orl = R(qa.panels[2].p);
    this.geo.tile1 = R(sh.tiles[1].e); this.geo.tile2 = R(sh.tiles[2].e);
    this.geo.gap0 = R(sh.gaps[0].g);
    this.geo.card0 = R(cm.cards[0].c); this.geo.card1 = R(cm.cards[1].c);
    this.buildCursor();
    // freeze state that the film changes
    pj.chips[2].e.style.left = (pj.stages[2].cx - 92) + 'px'; // Camera Detection starts one stage back and advances
    this.chip2x = [pj.stages[2].cx - 92, pj.stages[3].cx - 92];
    P.cursor.style.display = '';
  },
  // camera motion for the sound design: screen-space speed of the window's corners, pan velocity, zoom rate
  exportMotion(rate = 240) {
    const out = { rate, t0: TL.t0, t: [], speed: [], vx: [], zoom: [], cx: [], cy: [], curX: [], curY: [], curOn: [] };
    const pts = [[0, 0], [WIN_W, 0], [0, WIN_H], [WIN_W, WIN_H], [WIN_W / 2, WIN_H / 2]];
    let prev = null;
    for (let i = 0; TL.t0 + i / rate <= TL.t1 + 1e-9; i++) {
      const t = TL.t0 + i / rate;
      const c = CAM(t), T = solve(c);
      const P = pts.map(([x, y]) => project(c, T, x, y));
      if (prev) {
        let d = 0;
        for (let k = 0; k < 4; k++) d += Math.hypot(P[k][0] - prev[k][0], P[k][1] - prev[k][1]);
        out.t.push(+t.toFixed(5));
        out.speed.push(+(d / 4 * rate).toFixed(2));
        out.vx.push(+((P[4][0] - prev[4][0]) * rate).toFixed(2));
        out.zoom.push(+((Math.hypot(P[1][0] - P[0][0], P[1][1] - P[0][1]) / Math.hypot(prev[1][0] - prev[0][0], prev[1][1] - prev[0][1]) - 1) * rate).toFixed(4));
        out.cx.push(+P[4][0].toFixed(1)); out.cy.push(+P[4][1].toFixed(1));
        // where the cursor is on screen (the mix pans each click to it)
        const [ux, uy] = this.cur(t), U = project(c, T, ux, uy);
        out.curX.push(+U[0].toFixed(1)); out.curY.push(+U[1].toFixed(1));
        out.curOn.push(this.cursorWin.some(([a, b]) => t > a && t < b) ? 1 : 0);
      }
      prev = P;
    }
    return out;
  },
  mb(t) {
    if (t < TL.land - 0.2) return 8;
    const a = CAM(t - 1 / 120), b = CAM(t + 1 / 120);
    const Ta = solve(a), Tb = solve(b);
    const [x0, y0] = project(a, Ta, 800, 500), [x1, y1] = project(b, Tb, 800, 500);
    const v = Math.hypot(x1 - x0, y1 - y0) + Math.abs(b.s - a.s) * 1500 + Math.abs(b.ry - a.ry) * 30 + Math.abs(b.rx - a.rx) * 30;
    return v > 20 ? 8 : v > 6 ? 4 : v > 2 ? 2 : 1; // enough samples that a fast move blurs smoothly instead of stepping
  },
  update(t, imgs, api) {
    const P = this.P;
    // discrete things (counters, typed characters, switches, the caret) read the frame's own time, so the sub-frame
    // samples of the motion blur never print two digits on top of each other
    this.tq = Math.round(t * 60) / 60;
    // ---------------- camera
    const c = CAM(t);
    const T = solve(c);
    setT(this.winpos, `translate3d(${T.Tx.toFixed(2)}px, ${T.Ty.toFixed(2)}px, ${T.Tz.toFixed(2)}px) rotateX(${c.rx.toFixed(3)}deg) rotateY(${c.ry.toFixed(3)}deg) rotateZ(${c.rz.toFixed(3)}deg) scale(${c.s.toFixed(5)})`);
    const [wx, wy] = project(c, T, 800, 500);
    setT(this.glow, `translate(${(wx - 900).toFixed(1)}px, ${(wy - 900).toFixed(1)}px)`);
    // a soft reflection that slides across the glass as the window turns
    const sh = clamp(0.5 + c.ry / 60);
    P.sheen.style.background = `linear-gradient(${(100 + c.ry * 0.8).toFixed(1)}deg, rgba(255,255,255,0) ${(sh * 100 - 30).toFixed(1)}%, rgba(255,240,225,.035) ${(sh * 100).toFixed(1)}%, rgba(255,255,255,0) ${(sh * 100 + 30).toFixed(1)}%)`;
    // window fades as it recedes under the globe
    setO(this.winpos, 1 - clamp(inv(TL.recede + 0.35, TL.world + 0.35, t)) * 0.82);

    this.animNav(t);
    this.animPages(t);
    this.animCursor(t);
    animVerb(this.V[0], t, 1);
    animVerb(this.V[1], t, -1);
    animVerb(this.V[2], t, 0);
    animVerb(this.V[3], t, 1);
    this.animCreep(t);
    this.animWorld(t, api);
  },

  // ---------------- navigation: the pill follows the page
  animNav(t) {
    const P = this.P, g = this.nav;
    const steps = [[TL.t0, 'projects'], [TL.nav1, 'qa'], [TL.nav2, 'strategy'], [TL.nav3, 'commons']];
    let cur = steps[0], prev = steps[0];
    for (const s of steps) if (t >= s[0]) { prev = cur; cur = s; }
    const p = cur === steps[0] ? 1 : E.outExpo(inv(cur[0], cur[0] + 0.45, t));
    const a = g[prev[1]], b = g[cur[1]];
    const x = lerp(a.x, b.x, p), w = lerp(a.w, b.w, p);
    setT(P.navPill, `translate3d(${(x - 186).toFixed(2)}px, 0, 0)`); setW(P.navPill, w);
    const pb = cur === steps[0] ? 1 : E.outExpo(inv(cur[0] + 0.05, cur[0] + 0.55, t));
    setT(P.navBar, `translate3d(${(lerp(a.x, b.x, pb) - 186 + 14).toFixed(2)}px, 0, 0)`); setW(P.navBar, lerp(a.w, b.w, pb) - 28);
    P.navPill.style.left = '0px'; P.navBar.style.left = '0px';
    for (const k in P.nav) P.nav[k].classList.toggle('on', k === (p > 0.5 ? cur[1] : prev[1]));
  },

  // ---------------- pages
  animPages(t) {
    const P = this.P, pg = P.pages;
    // page switching: outgoing slides left and fades, incoming settles from the right
    const sw = [[pg.projects, TL.t0 - 1, TL.nav1], [pg.qa, TL.nav1, TL.nav2], [pg.strategy, TL.nav2, TL.nav3], [pg.commons, TL.nav3, 99]];
    for (const [H, a, b] of sw) {
      const on = t >= a + 0.06 && t < b + 0.34;
      show(H.page, on);
      if (!on) continue;
      const pin = a < TL.t0 ? 1 : E.hey(inv(a + 0.06, a + 0.52, t));
      const pout = E.inCubic(inv(b, b + 0.3, t));
      setT(H.page, `translate3d(${((1 - pin) * 60 - pout * 60).toFixed(2)}px, 0, 0)`);
      setO(H.page, clamp(inv(a + 0.06, a + 0.3, t)) * (1 - pout));
    }
    this.animProjects(t, pg.projects);
    this.animQA(t, pg.qa);
    this.animStrategy(t, pg.strategy);
    this.animCommons(t, pg.commons);
  },

  animProjects(t, H) {
    if (t > TL.nav1 + 0.4) return;
    const A0 = 7.8;
    settle(H.head, t, A0 + 0.05);
    pop(H.newBtn, t, A0 + 0.3);
    settle(H.team, t, A0 + 0.25);
    settle(H.pipe, t, A0 + 0.12, 0.55, 24);
    // stage nodes pop in sequence; the progress line runs to the furthest project
    H.stages.forEach((s, i) => {
      const Ti = A0 + 0.35 + i * 0.07;
      pop(s.node, t, Ti, 0.45, 0.4);
      settle(s.lab, t, Ti + 0.05, 0.45, 10);
      if (s.line) setO(s.line, clamp(inv(Ti + 0.05, Ti + 0.25, t)));
    });
    const reach = lerp(0, this.stageX[2] - this.stageX[0], E.inOutCubic(inv(A0 + 0.55, A0 + 1.25, t)))
      + (this.stageX[3] - this.stageX[2]) * E.inOutCubic(inv(TL.stageMove, TL.stageMove + 0.55, t));
    setW(H.fill, Math.max(0, reach));
    H.lanes.forEach((l, i) => setO(l, i === 0 || i === 1 || i === 3 ? 0 : clamp(inv(A0 + 0.9 + i * 0.03, A0 + 1.1 + i * 0.03, t))));
    H.chips.forEach((ch, i) => {
      const Ti = A0 + 0.95 + i * 0.1;
      const p = E.outBackSoft(inv(Ti, Ti + 0.5, t));
      let x = 0;
      if (i === 2) x = (this.chip2x[1] - this.chip2x[0]) * E.inOutCubic(inv(TL.stageMove + 0.08, TL.stageMove + 0.6, t));
      const lift = i === 2 ? Math.sin(Math.PI * clamp(inv(TL.stageMove + 0.02, TL.stageMove + 0.66, t))) : 0;
      setT(ch.e, `translate3d(${x.toFixed(2)}px, ${((1 - p) * -28 - 6 * lift).toFixed(2)}px, 0) scale(${(lerp(0.9, 1, p) + 0.04 * lift).toFixed(4)})`);
      setO(ch.e, clamp(inv(Ti, Ti + 0.15, t)));
      ch.e.style.boxShadow = i === 2 ? `inset 0 0 0 1.5px rgba(251,139,36,.48), 0 ${(18 * lift).toFixed(1)}px ${(40 * lift).toFixed(1)}px rgba(0,0,0,${(0.5 * lift).toFixed(3)})` : ch.e.style.boxShadow;
    });
    // node 4 lights as the project arrives
    const lit = Math.exp(-Math.max(0, t - (TL.stageMove + 0.55)) * 3.5) * (t >= TL.stageMove + 0.55 ? 1 : 0);
    H.stages[3].node.style.boxShadow = `inset 0 0 0 1.5px rgba(251,139,36,.65), 0 0 ${(26 * lit).toFixed(1)}px rgba(251,139,36,${(0.9 * lit).toFixed(3)})`;
    // lower half
    settle(H.sec1, t, A0 + 0.45);
    H.cards.forEach((cd, i) => {
      settle(cd.c, t, A0 + 0.5 + i * 0.08, 0.55, 30);
      const fp = E.outCubic(inv(A0 + 0.9, A0 + 1.7, t));
      cd.fill.style.width = (cd.target * fp).toFixed(2) + '%';
      setTxt(cd.pct, Math.round(cd.target * E.outCubic(inv(A0 + 0.9, A0 + 1.7, this.tq))) + '% complete');
    });
    settle(H.sec2, t, A0 + 0.6);
    settle(H.sec3, t, A0 + 0.62);
    settle(H.arc, t, A0 + 0.68, 0.55, 30);
    settle(H.ws, t, A0 + 0.55, 0.55, 30);
    // shared work: the team is invited, the partner agency joins, their project arrives with editor access
    const hovI = clamp(inv(TL.invite - 0.25, TL.invite - 0.08, t)) * (1 - clamp(inv(TL.invite + 0.35, TL.invite + 0.6, t)));
    const pressI = t >= TL.invite ? Math.exp(-(t - TL.invite) * 10) : 0;
    setT(H.invite, `scale(${(1 + 0.03 * hovI - 0.06 * pressI).toFixed(4)})`);
    H.invite.style.boxShadow = `inset 0 0 0 1px rgba(255,255,255,${(0.11 + 0.3 * hovI).toFixed(3)}), 0 0 0 ${(4 * hovI).toFixed(2)}px rgba(251,139,36,${(0.3 * hovI).toFixed(3)})`;
    const po = H.orgs[1];
    const pp = E.hey(inv(TL.partner, TL.partner + 0.5, t));
    setT(po, `translate3d(${((1 - pp) * 26).toFixed(2)}px, 0, 0)`);
    setO(po, clamp(inv(TL.partner, TL.partner + 0.2, t)));
    const glowP = Math.exp(-Math.max(0, t - TL.partner - 0.2) * 2.2) * (t > TL.partner ? 1 : 0);
    po.style.background = `rgba(66,129,164,${(0.16 * glowP).toFixed(3)})`;
    po.style.borderRadius = '12px';
    H.roles.forEach((r, i) => settle(r, t, (i === 2 ? TL.partner + 0.25 : A0 + 0.7 + i * 0.05), 0.5, 10));
    const ep = E.hey(inv(TL.extIn, TL.extIn + 0.55, t));
    setT(H.ext.c, `translate3d(0, ${((1 - ep) * 40).toFixed(2)}px, 0)`);
    setO(H.ext.c, clamp(inv(TL.extIn, TL.extIn + 0.2, t)));
    setO(H.sec2, clamp(inv(TL.extIn - 0.15, TL.extIn + 0.05, t)));
    setTxt(H.sec2.lastChild, this.tq > TL.extIn ? '1' : '0');
    const efp = E.outCubic(inv(TL.extIn + 0.3, TL.extIn + 1.0, t));
    H.ext.fill.style.width = (8 * efp).toFixed(2) + '%';
    setTxt(H.ext.pct, Math.round(8 * E.outCubic(inv(TL.extIn + 0.3, TL.extIn + 1.0, this.tq))) + '% complete');
  },

  animQA(t, H) {
    if (t < TL.nav1 || t > TL.nav2 + 0.4) return;
    const A0 = TL.nav1 + 0.12;
    settle(H.kick, t, A0 + 0.05, 0.5, 10);
    settle(H.h1, t, A0 + 0.1, 0.55, 16);
    settle(H.shell, t, A0 + 0.18, 0.55, 22);
    settle(H.side, t, A0 + 0.3, 0.55, 22);
    // typing: the proposal, then the attachment lands
    const s = typed(QA_TEXT, this.tq, TL.typeA, TL.typeB);
    setTxt(H.typed, s);
    show(H.ph, t < TL.typeA);
    const blink = t > TL.typeA && t < TL.typeB ? 1 : Math.floor(this.tq * 2.4) % 2 ? 1 : 0.15;
    setO(H.caret, t > TL.focusIn && t < TL.assess ? blink : 0);
    const foc = clamp(inv(TL.focusIn, TL.focusIn + 0.2, t)) * (1 - clamp(inv(TL.assess, TL.assess + 0.3, t)));
    H.shell.style.boxShadow = `inset 0 0 0 1px rgba(255,255,255,${(0.11 + 0.1 * foc).toFixed(3)}), inset 0 1px 0 rgba(255,255,255,.04), 0 0 0 ${(3 * foc).toFixed(2)}px rgba(251,139,36,${(0.22 * foc).toFixed(3)}), 0 24px 60px rgba(0,0,0,.35)`;
    const pressP = t >= TL.plus ? Math.exp(-(t - TL.plus) * 10) : 0;
    setT(H.plus, `scale(${(1 - 0.08 * pressP).toFixed(4)})`);
    const fp = E.outBackSoft(inv(TL.attach, TL.attach + 0.45, t));
    setT(H.file, `translate3d(0, ${((1 - fp) * 10).toFixed(2)}px, 0) scale(${lerp(0.8, 1, fp).toFixed(4)})`);
    setO(H.file, clamp(inv(TL.attach, TL.attach + 0.12, t)));
    // the press
    const hover = clamp(inv(TL.assess - 0.2, TL.assess - 0.05, t)) * (1 - clamp(inv(TL.assess + 0.4, TL.assess + 0.6, t)));
    const press = t >= TL.assess ? Math.exp(-(t - TL.assess) * 10) : 0;
    setT(H.btn, `scale(${(1 + 0.03 * hover - 0.07 * press).toFixed(4)})`);
    H.btn.style.filter = `brightness(${(1 + 0.1 * hover + 0.25 * press).toFixed(3)})`;
    H.btn.style.boxShadow = `0 8px 22px rgba(251,139,36,.26), inset 0 1px 0 rgba(255,255,255,.28), 0 0 0 ${(4 * hover).toFixed(2)}px rgba(251,139,36,${(0.28 * hover).toFixed(3)}), 0 0 ${(40 * press).toFixed(1)}px rgba(251,139,36,${(0.6 * press).toFixed(3)})`;
    setT(H.spark, `rotate(${(E.outCubic(inv(TL.assess, TL.assess + 0.7, t)) * 180).toFixed(1)}deg)`);
    // research progress, then the brief
    const prOn = t > TL.assess + 0.05 && t < TL.brief + 0.25;
    show(H.prog, prOn);
    if (prOn) {
      setO(H.prog, clamp(inv(TL.assess + 0.05, TL.assess + 0.2, t)) * (1 - clamp(inv(TL.brief, TL.brief + 0.2, t))));
      const ph = ((t - TL.assess) * 1.6) % 1;
      setT(H.progI, `translateX(${(-340 + ph * 1400).toFixed(1)}px)`);
    }
    const bOn = t > TL.brief;
    show(H.brief, bOn);
    if (bOn) {
      settle(H.brief, t, TL.brief, 0.6, 36);
      H.panels.forEach((p, i) => {
        const Ti = TL.brief + 0.2 + i * 0.1;
        settle(p.p, t, Ti, 0.5, 18);
        const lv = Math.round(p.lv * E.outCubic(inv(Ti + 0.1, Ti + 0.6, this.tq)));
        setTxt(p.n, String(Math.max(1, lv)));
        p.segs.forEach((sg, j) => { sg.style.background = j < lv ? p.col : 'rgba(255,255,255,.08)'; });
      });
      const { SX, cw } = H.cellGeo;
      H.cells.forEach((cel, i) => {
        const Ti = TL.brief + 0.5 + i * 0.03;
        settle(cel, t, Ti, 0.4, 10);
        const sel = (i === 5 && this.tq > TL.badges + 0.1) || (i === 6 && this.tq > TL.badges);
        cel.classList.toggle('sel', sel);
      });
      H.bAss.style.left = (SX + 5 * (cw + 8) + cw / 2 - 44) + 'px';
      H.bDecl.style.left = (SX + 6 * (cw + 8) + cw / 2 - 42) + 'px';
      pop(H.bDecl, t, TL.badges, 0.4, 0.6);
      pop(H.bAss, t, TL.badges + 0.1, 0.4, 0.6);
      settle(H.callout, t, TL.badges + 0.3, 0.5, 10);
      pop(H.saved, t, TL.brief + 0.35, 0.4, 0.7);
    }
    show(H.empty1, t < TL.brief + 0.6);
    setO(H.empty1, 1 - clamp(inv(TL.brief + 0.4, TL.brief + 0.6, t)));
    const ni = E.hey(inv(TL.brief + 0.55, TL.brief + 1.0, t));
    setT(H.newItem, `translate3d(${((1 - ni) * 30).toFixed(2)}px, 0, 0)`);
    setO(H.newItem, clamp(inv(TL.brief + 0.55, TL.brief + 0.7, t)));
  },

  animStrategy(t, H) {
    if (t < TL.nav2 || t > TL.nav3 + 0.4) return;
    const A0 = TL.nav2 + 0.02;
    settle(H.head, t, A0, 0.5, 10);
    H.tabs.forEach((e, i) => settle(e, t, A0 + 0.05 + i * 0.04, 0.45, 8));
    setT(H.ul, `scaleX(${E.outExpo(inv(A0 + 0.3, A0 + 0.8, t)).toFixed(4)})`); H.ul.style.transformOrigin = '0 0';
    // tiles rise out of the table
    const aligned = this.tq > TL.tilesUpd;
    const rowDone = this.tq > TL.rowUpd;
    H.tiles.forEach((tl, i) => {
      const Ti = A0 + 0.12 + i * 0.08;
      const p = E.outBackSoft(inv(Ti, Ti + 0.6, t));
      setT(tl.e, `translate3d(0, ${((1 - p) * 30).toFixed(2)}px, ${((1 - p) * 90).toFixed(2)}px)`);
      setO(tl.e, clamp(inv(Ti, Ti + 0.15, t)));
      let v = Math.round(tl.n * E.outCubic(inv(Ti + 0.1, Ti + 0.9, this.tq)));
      if (aligned && i === 1) v = 1;
      if (aligned && i === 2) v = 104;
      setTxt(tl.num, v + tl.suf);
    });
    setTxt(H.tiles[1].s, aligned ? '1 of 124 have aligned projects' : '0 of 124 have aligned projects');
    setTxt(H.tiles[3].s, aligned ? '1 unaligned' : '2 unaligned');
    const flash = aligned ? Math.exp(-(t - TL.tilesUpd) * 2.5) : 0;
    [1, 2, 3].forEach((i) => { H.tiles[i].e.style.boxShadow = `inset 0 0 0 1px rgba(255,255,255,.07), 0 0 0 ${(2 * flash).toFixed(2)}px rgba(114,168,165,${(0.7 * flash).toFixed(3)}), 0 0 ${(40 * flash).toFixed(1)}px rgba(114,168,165,${(0.35 * flash).toFixed(3)})`; });
    for (const [p, Ti] of [[H.panL, A0 + 0.3], [H.panR, A0 + 0.36], [H.panG, A0 + 0.44]]) settle(p, t, Ti, 0.6, 26);
    const { x0, x1, maxV } = H.chart;
    H.bars.forEach((b, i) => {
      const Ti = A0 + 0.55 + i * 0.1;
      const w = (b.v / maxV) * (x1 - x0) * E.outExpo(inv(Ti, Ti + 0.9, t));
      setW(b.b, w);
      setT(b.bv, `translate3d(${(w + 10).toFixed(2)}px, 0, 0)`);
      setO(b.bv, clamp(inv(Ti + 0.3, Ti + 0.5, t)));
    });
    H.docs.forEach((d, i) => {
      const cov = aligned && i === 0;
      d.f.style.width = cov ? (100 / d.c * E.outCubic(inv(TL.tilesUpd, TL.tilesUpd + 0.5, t))).toFixed(2) + '%' : '0%';
      setTxt(d.ct, `${cov ? 1 : 0} / ${d.c}`);
    });
    // scroll down to the gaps, align a project, scroll back
    const g0 = H.gaps[0];
    const popP = E.hey(inv(TL.align + 0.05, TL.align + 0.4, t)) * (1 - E.inCubic(inv(TL.pick + 0.12, TL.pick + 0.32, t)));
    show(H.pop, popP > 0.001);
    H.pop.style.left = (1556 - 22 - 16 - 330) + 'px';
    H.pop.style.top = (600 + 54 + 66) + 'px';
    setT(H.pop, `translate3d(0, ${((1 - popP) * -10).toFixed(2)}px, 0) scale(${lerp(0.96, 1, popP).toFixed(4)})`);
    setO(H.pop, popP);
    H.pop.style.transformOrigin = '100% 0';
    const hov = clamp(inv(TL.pick - 0.25, TL.pick - 0.1, t));
    H.popOpts[0].style.background = `rgba(251,139,36,${(0.12 * hov).toFixed(3)})`;
    const pressA = t > TL.align ? Math.exp(-(t - TL.align) * 10) : 0;
    const hovA = clamp(inv(TL.align - 0.2, TL.align - 0.05, t)) * (1 - clamp(inv(TL.align + 0.3, TL.align + 0.5, t)));
    setT(g0.btn, `scale(${(1 - 0.06 * pressA).toFixed(4)})`);
    g0.btn.style.boxShadow = `inset 0 0 0 1px rgba(255,255,255,${(0.11 + 0.3 * hovA).toFixed(3)}), 0 0 0 ${(4 * hovA).toFixed(2)}px rgba(251,139,36,${(0.3 * hovA).toFixed(3)})`;
    show(g0.btn, !rowDone);
    const okp = E.outBackSoft(inv(TL.rowUpd, TL.rowUpd + 0.45, t));
    setO(g0.ok, clamp(inv(TL.rowUpd, TL.rowUpd + 0.15, t)));
    setT(g0.ok, `scale(${lerp(0.7, 1, okp).toFixed(4)})`);
    setTxt(g0.st, rowDone ? '1 aligned project' : 'no aligned projects');
    g0.st.style.color = rowDone ? '#8CC2BE' : '#E0685C';
    const rowGlow = rowDone ? Math.exp(-(t - TL.rowUpd) * 1.8) : 0;
    g0.g.style.background = `rgba(54,130,127,${(0.14 * rowGlow).toFixed(3)})`;
  },

  animCommons(t, H) {
    if (t < TL.nav3) return;
    const A0 = TL.nav3 + 0.12;
    settle(H.head, t, A0, 0.5, 10);
    const sp = E.hey(inv(A0 + 0.04, A0 + 0.54, t));
    setT(H.search, `translate3d(0, ${((1 - sp) * 18).toFixed(2)}px, 0) scaleX(${lerp(0.94, 1, sp).toFixed(4)})`);
    setO(H.search, clamp(inv(A0 + 0.1, A0 + 0.25, t)));
    settle(H.tk, t, A0 + 0.12, 0.4, 8);
    H.trend.forEach((c, i) => pop(c, t, A0 + 0.15 + i * 0.05, 0.45, 0.9));
    settle(H.fk, t, A0 + 0.24, 0.4, 8);
    H.filters.concat(H.regions).forEach((f, i) => settle(f, t, A0 + 0.26 + i * 0.02, 0.4, 8));
    // typing the question
    const q = typed(ASK_Q, this.tq, TL.typeC, TL.typeD);
    setTxt(H.q, q);
    show(H.qPh, t < TL.typeC);
    const blink = t > TL.typeC && t < TL.typeD ? 1 : Math.floor(this.tq * 2.4) % 2 ? 1 : 0.15;
    setO(H.qCaret, t > TL.searchClick && t < TL.ask ? blink : 0);
    const focS = clamp(inv(TL.searchClick, TL.searchClick + 0.2, t)) * (1 - clamp(inv(TL.ask + 0.2, TL.ask + 0.5, t)));
    H.search.style.boxShadow = `inset 0 0 0 1px rgba(255,255,255,${(0.11 + 0.1 * focS).toFixed(3)}), inset 0 1px 0 rgba(255,255,255,.04), 0 0 0 ${(3 * focS).toFixed(2)}px rgba(251,139,36,${(0.22 * focS).toFixed(3)}), 0 18px 44px rgba(0,0,0,.3)`;
    // Ask Heyden
    const hover = clamp(inv(TL.ask - 0.2, TL.ask - 0.05, t));
    const press = t >= TL.ask ? Math.exp(-(t - TL.ask) * 10) : 0;
    setT(H.ask, `scale(${(1 + 0.03 * hover * (1 - press) - 0.07 * press).toFixed(4)})`);
    H.ask.style.boxShadow = `0 8px 22px rgba(253,186,116,.22), inset 0 1px 0 rgba(255,255,255,.4), 0 0 ${(36 * (hover * 0.6 + press)).toFixed(1)}px rgba(253,186,116,${(0.5 * hover + 0.4 * press).toFixed(3)})`;
    // the task card settles in (the product's own .42s curve), researches, then shows its curated view
    const kp = E.hey(inv(TL.ask + 0.08, TL.ask + 0.5, t));
    const cardOn = t > TL.ask + 0.08;
    show(H.askCard, cardOn);
    setT(H.askCard, `translate3d(0, ${((1 - kp) * 24).toFixed(2)}px, 0) scale(${lerp(0.97, 1, kp).toFixed(4)})`);
    setO(H.askCard, clamp(inv(TL.ask + 0.08, TL.ask + 0.25, t)));
    const researching = this.tq < TL.curated;
    show(H.askStatus, researching); show(H.askBar, researching);
    if (researching) setT(H.askBarI, `translateX(${(-500 + (((t - TL.ask) * 1.5) % 1) * 2000).toFixed(1)}px)`);
    show(H.askDone, !researching);
    [...H.askDone.children].forEach((ch, i) => { const p = E.outBackSoft(inv(TL.curated + i * 0.06, TL.curated + 0.4 + i * 0.06, t)); setT(ch, `scale(${lerp(0.8, 1, p).toFixed(4)})`); setO(ch, clamp(p * 2)); });
    // results: cards cascade in under the card, then re-sort to the curated order
    const push = E.hey(inv(TL.ask + 0.08, TL.ask + 0.6, t));
    H.cards.forEach((cd, i) => {
      const Ti = A0 + 0.34 + i * 0.045;
      const p = E.hey(inv(Ti, Ti + 0.55, t));
      const hit = [1, 5, 0].includes(i);
      const dim = t > TL.curated ? (hit ? 0 : 0.55 * E.outCubic(inv(TL.curated, TL.curated + 0.4, t))) : 0;
      setT(cd.c, `translate3d(0, ${((1 - p) * 30).toFixed(2)}px, 0)`);
      setO(cd.c, clamp(inv(Ti, Ti + 0.2, t)) * (1 - dim));
      const hl = hit && t > TL.curated ? E.outCubic(inv(TL.curated + 0.1 + i * 0.03, TL.curated + 0.5, t)) : 0;
      cd.c.style.boxShadow = `inset 0 0 0 1px rgba(255,255,255,.07), inset 0 0 0 ${(1.5 * hl).toFixed(2)}px rgba(111,163,194,${(0.55 * hl).toFixed(3)}), 0 0 ${(30 * hl).toFixed(1)}px rgba(66,129,164,${(0.25 * hl).toFixed(3)})`;
    });
    // results sit below the card: before the card exists, the grid sits higher
    const gridShift = (1 - push) * -152;
    H.cards.forEach((cd) => { cd.c.style.marginTop = gridShift.toFixed(2) + 'px'; });
    H.count.style.marginTop = gridShift.toFixed(2) + 'px';
    setO(H.count, clamp(inv(A0 + 0.6, A0 + 0.8, t)));
  },

  // ---------------- cursor: the person using Heyden. It moves the way a hand does (a quick start, a long soft landing, a
  // slight arc), rests on what it clicks, and steps out of the way while text is typed. [t, x, y] in window space;
  // equal keys rest.
  buildCursor() {
    const g = this.geo, n = this.nav;
    const navC = (k) => [n[k].x + n[k].w * 0.52, n[k].y + n[k].h * 0.6];
    const C = (r, dx = 0, dy = 0) => [r.cx + dx, r.cy + dy];
    const K = [
      // Collaborate: Invite your team, the partner agency's row, their project, then Quick Assessment
      [TL.invite - 0.85, 1190, 800], [TL.invite - 0.7, 1190, 800],
      [TL.invite - 0.2, ...C(g.invite, 6, 6)], [TL.invite + 0.15, ...C(g.invite, 8, 10)],
      [TL.partner + 0.45, ...C(g.partnerRow, 112, 8)], [TL.partner + 0.65, ...C(g.partnerRow, 112, 8)],
      [TL.extIn + 0.25, ...C(g.ext, 180, -35)], [TL.nav1 - 0.75, ...C(g.ext, 186, -31)],
      [TL.nav1 - 0.1, ...navC('qa')], [TL.nav1 + 0.45, ...navC('qa')],
      // Innovate: into the box, out of the way while typing, "+" for the PDF, Assess, then down through the brief
      [TL.focusIn - 0.5, 430, 470], [TL.focusIn - 0.35, 430, 470],
      [TL.focusIn - 0.05, g.qaInput.x + 100, g.qaInput.y + 54], [TL.focusIn + 0.1, g.qaInput.x + 100, g.qaInput.y + 54],
      [TL.focusIn + 0.5, 700, 330], [TL.typeB + 0.05, 700, 330],
      [TL.plus - 0.05, ...C(g.qaPlus, 3, 3)], [TL.plus + 0.1, ...C(g.qaPlus, 5, 5)],
      [TL.assess - 0.15, ...C(g.qaBtn, -2, 3)], [TL.assess + 0.05, ...C(g.qaBtn, 0, 5)],
      [TL.brief + 0.15, 420, 660], [TL.brief + 0.65, 420, 660],
      [TL.badges - 0.1, ...C(g.cell6, 0, 8)], [TL.nav2 - 0.7, ...C(g.cell6, 4, 12)],
      [TL.nav2 - 0.1, ...navC('strategy')], [TL.nav2 + 0.45, ...navC('strategy')],
      // Strategise: Align project, pick the project, out of the way as the row updates, up to the tiles, on to the Commons
      [TL.v3Out + 0.25, 1060, 560], [TL.v3Out + 0.35, 1060, 560],
      [TL.align - 0.1, ...C(g.alignBtn, 5, 4)], [TL.align + 0.15, ...C(g.alignBtn, 7, 8)],
      [TL.pick - 0.1, ...C(g.opt0, -23, 3)], [TL.pick + 0.1, ...C(g.opt0, -21, 5)],
      [TL.rowUpd + 0.25, 1190, 800], [TL.rowUpd + 0.4, 1190, 800],
      [TL.tilesUpd - 0.05, ...C(g.tile1, 90, 40)], [TL.tilesUpd + 0.55, ...C(g.tile1, 92, 42)],
      [TL.tilesUpd + 0.85, ...C(g.tile2, 10, 30)], [TL.nav3 - 0.4, ...C(g.tile2, 12, 32)],
      [TL.nav3 - 0.1, ...navC('commons')], [TL.nav3 + 0.45, ...navC('commons')],
      // Solve: into the search, out of the way while the question is typed, Ask Heyden, then down to its curated view
      [TL.searchClick - 0.55, 620, 430], [TL.searchClick - 0.45, 620, 430],
      [TL.searchClick - 0.1, g.cmSearch.x + 256, g.cmSearch.cy + 4], [TL.searchClick + 0.05, g.cmSearch.x + 256, g.cmSearch.cy + 4],
      [TL.searchClick + 0.4, 640, 300], [TL.typeD + 0.05, 640, 300],
      [TL.ask - 0.1, ...C(g.cmAsk, 2, 4)], [TL.ask + 0.1, ...C(g.cmAsk, 4, 8)],
      [TL.curated + 0.05, 700, 660], [TL.curated + 0.35, 700, 660],
      [TL.recede - 0.2, ...C(g.card1, 20, 40)], [TL.recede + 0.1, ...C(g.card1, 22, 42)],
    ];
    const base = track(K, bezier(0.3, 0, 0.12, 1));
    // a slight arc on every move, like a wrist
    this.cur = (t) => {
      const [x, y] = base(t);
      let i = K.findIndex((k) => k[0] > t);
      if (i <= 0) return [x, y];
      const a = K[i - 1], b = K[i], dx = b[1] - a[1], dy = b[2] - a[2], d = Math.hypot(dx, dy);
      if (d < 1) return [x, y];
      const bow = Math.sin(Math.PI * inv(a[0], b[0], t)) * d * 0.07;
      return [x - (dy / d) * bow, y + (dx / d) * bow];
    };
    this.cursorWin = [[TL.invite - 0.85, TL.nav1 + 0.45], [TL.focusIn - 0.5, TL.nav2 + 0.45], [TL.v3Out + 0.25, TL.nav3 + 0.45], [TL.searchClick - 0.55, TL.recede + 0.1]];
    this.clicks = [TL.invite, TL.nav1, TL.focusIn, TL.plus, TL.assess, TL.nav2, TL.align, TL.pick, TL.nav3, TL.searchClick, TL.ask];
  },
  animCursor(t) {
    const P = this.P;
    const vis = this.cursorWin.some(([a, b]) => t > a && t < b);
    const fade = this.cursorWin.reduce((m, [a, b]) => m + Math.min(clamp(inv(a, a + 0.2, t)), 1 - clamp(inv(b - 0.2, b, t))), 0);
    show(P.cursor, vis);
    let press = 0, ring = null;
    for (const T of this.clicks) {
      if (t >= T && t < T + 0.25) press = Math.max(press, Math.exp(-(t - T) * 14));
      if (t >= T && t < T + 0.45) ring = T;
    }
    const [x, y] = this.cur(t);
    if (vis) {
      setT(P.cursor, `translate3d(${(x - 4).toFixed(2)}px, ${(y - 3).toFixed(2)}px, 0) scale(${(1 - 0.14 * press).toFixed(4)})`);
      setO(P.cursor, clamp(fade));
    }
    show(P.click, ring != null && vis);
    if (ring != null) {
      const p = inv(ring, ring + 0.45, t);
      const r = lerp(8, 34, E.outCubic(p));
      setT(P.click, `translate3d(${(x - 30).toFixed(2)}px, ${(y - 30).toFixed(2)}px, 0) scale(${(r / 30).toFixed(4)})`);
      setO(P.click, (1 - p) * 0.9);
    }
  },

  // ---------------- "Kill scope creep.": the word creeps out, then is clamped back
  animCreep(t) {
    const w = this.creep;
    const st = E.inQuad(inv(TL.creep, TL.creep + 0.55, t)) * (1 - E.outExpo(inv(TL.creep + 0.58, TL.creep + 0.78, t)));
    w.style.letterSpacing = (0.34 * st).toFixed(4) + 'em';
    const snap = t >= TL.creep + 0.58 ? Math.exp(-(t - TL.creep - 0.58) * 6) : 0;
    w.style.color = snap > 0.02 ? `rgb(255,${Math.round(255 - 116 * snap)},${Math.round(255 - 219 * snap)})` : '';
  },

  // ---------------- the Commons spans the world
  animWorld(t, api) {
    const g = this.g;
    g.clearRect(0, 0, 1920, 1080);
    const gp = E.outQuart(inv(TL.world - 0.25, TL.world + 0.75, t));
    const push = E.inCubic(inv(TL.push, TL.t1, t));
    show(this.gcv, gp > 0);
    if (gp > 0) {
      const R = lerp(400, 440, gp) * (1 + 0.22 * push);
      const cy = lerp(1560, this.worldLines.length > 1 ? 740 : 700, gp) - 60 * push;
      const lon0 = lerp(-168, -140, inv(TL.world - 0.25, TL.t1, t));
      drawGlobe(g, t, this.pts, 960, cy, R, lon0, 16, gp, TL.world + 0.2);
    }
    show(this.world, t > TL.world);
    this.worldW.forEach((w, i) => {
      const Ti = TL.world + 0.2 + i * 0.045;
      const p = E.outExpo(inv(Ti, Ti + 0.55, t));
      setT(w, `translate3d(0, ${((1 - p) * 60).toFixed(1)}px, 0)`);
      setO(w, clamp(inv(Ti, Ti + 0.2, t)));
    });
    setT(this.world, `translate(0px, ${lerp(this.worldLines.length > 1 ? 70 : 96, this.worldLines.length > 1 ? 80 : 108, inv(TL.world, TL.t1, t)).toFixed(1)}px)`);
  },
};
