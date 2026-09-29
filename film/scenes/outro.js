import { clamp, lerp, inv, anim, kf, E, spring, hash, hash2, fbm, TAU, div, el, splitChars, splitWords, setT, setO, show } from '../lib.js';
import { makeH, HM } from './intro.js';

// ------------------------------------------------------------------ S8 One Commons. Many ways in. 21.85–24.05
const ROLES = ['Vendor', 'Researcher', 'Industry body', 'Agency']; // pricing page role picker
export const S8 = {
  t0: 22.0, t1: 24.06,
  build(world) {
    this.root = div('scene', world);
    this.root.style.background = 'radial-gradient(ellipse 60% 60% at 50% 55%, #16110D 0%, #0B0A0A 60%, #080808 100%)';
    this.cam = div('layer', this.root);
    this.head = div('bigline', this.cam);
    this.head.style.fontSize = '118px';
    this.hw = splitWords(this.head, 'One Commons. Many ways in.');
    this.chips = ROLES.map((r) => div('role', this.cam, r));
    const ws = this.chips.map((c) => c.getBoundingClientRect().width);
    const gap = 26, total = ws.reduce((a, b) => a + b, 0) + gap * 3;
    let x = 960 - total / 2;
    this.pos = ws.map((w) => { const p = x; x += w + gap; return p; });
    this.ws = ws;
    this.from = [[-900, 0], [0, -700], [0, 700], [900, 0]];
  },
  mb(t) { return t < 22.45 || t > 23.72 ? 8 : 4; },
  update(t, imgs, api) {
    // arrive: the globe collapses behind while the roles fly in from every side
    setO(this.root, 1);
    const ex = E.inExpo(inv(23.74, 24.02, t));
    setT(this.cam, `scale(${lerp(1, 1.35, ex).toFixed(4)})`);
    this.cam.style.transformOrigin = '960px 560px';
    setO(this.cam, 1 - ex);
    setT(this.head, `translate(0px, ${(372).toFixed(1)}px)`);
    this.hw.forEach((w, i) => {
      const T = 22.1 + i * 0.07 + (i >= 2 ? 0.2 : 0);
      const p = E.outExpo(inv(T, T + 0.55, t));
      setT(w, `translate3d(0, ${((1 - p) * 110).toFixed(1)}%, 0)`);
    });
    const beat = Math.floor((t - 22.75) / 0.25);
    this.chips.forEach((c, i) => {
      const T = 21.88 + i * 0.045;
      const p = E.outExpo(inv(T, T + 0.45, t));
      const [fx, fy] = this.from[i];
      const x = this.pos[i] + fx * (1 - p), y = 604 + fy * (1 - p);
      const on = t >= 22.75 && t < 23.75 && beat === i;
      const bump = on ? Math.exp(-(t - (22.75 + i * 0.25)) * 12) : 0;
      setT(c, `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) scale(${(1 + 0.06 * bump).toFixed(4)})`);
      setO(c, clamp(inv(T, T + 0.1, t)));
      const cls = 'role' + (on ? ' on' : '');
      if (c.className !== cls) c.className = cls;
    });
  },
};

// ------------------------------------------------------------------ S9 Ideas to Outcomes -> mark -> lockup 23.9–30.0
export const S9 = {
  t0: 23.88, t1: 30.01,
  needs(t) {
    if (t > 25.9) return [];
    return [{ name: 'crews', idx: Math.floor((0.3 + (t - 23.9) * 0.9) * 29.97) }];
  },
  build(world) {
    this.root = div('scene', world);
    this.root.style.background = '#080808';
    this.fcv = el('canvas', 'abs', this.root);
    this.fcv.width = 1920; this.fcv.height = 1080;
    this.fc = this.fcv.getContext('2d');
    this.shade = div('layer', this.root);
    this.shade.style.background = 'radial-gradient(ellipse 65% 60% at 50% 50%, rgba(8,8,8,.5) 0%, rgba(8,8,8,.82) 70%, rgba(8,8,8,.95) 100%)';
    this.warm = div('layer', this.root);
    this.warm.style.background = 'radial-gradient(ellipse 55% 55% at 50% 48%, rgba(255,87,34,.16) 0%, rgba(255,87,34,.05) 40%, rgba(0,0,0,0) 70%)';
    this.cam = div('layer', this.root);
    this.ecv = el('canvas', 'abs', this.cam);
    const dpr = window.devicePixelRatio || 1; // sharp stems when the film is rendered at 2x
    this.ecv.width = 1920 * dpr; this.ecv.height = 1080 * dpr;
    this.ecv.style.width = '1920px'; this.ecv.style.height = '1080px';
    this.ec = this.ecv.getContext('2d');
    this.ec.scale(dpr, dpr);
    // words
    this.wI = div('s9-word', this.cam, 'Ideas');
    this.wT = div('s9-word s9-to', this.cam, 'to');
    this.wO = div('s9-word', this.cam, 'Outcomes');
    const m = (e) => e.getBoundingClientRect().width;
    this.w = [m(this.wI), m(this.wT), m(this.wO)];
    const sp = 176 * 0.26;
    const total = this.w[0] + this.w[1] + this.w[2] + sp * 2;
    const x0 = 960 - total / 2;
    this.wx = [x0, x0 + this.w[0] + sp, x0 + this.w[0] + this.w[1] + sp * 2];
    for (const [e, i] of [[this.wI, 0], [this.wT, 1], [this.wO, 2]]) e.style.transformOrigin = `${this.w[i] / 2}px 88px`;
    // the mark, sized for the morph
    this.Hh = 440;
    this.hwrap = div('abs', this.cam);
    this.H = makeH(this.hwrap, this.Hh);
    Object.assign(this.hwrap.style, { width: this.H.w + 'px', height: this.H.h + 'px' });
    this.ring = div('s3-ring', this.cam);
    this.bcv = el('canvas', 'abs', this.cam);
    this.bcv.width = 1920; this.bcv.height = 1080;
    this.bc = this.bcv.getContext('2d');
    this.sheen = div('abs', this.hwrap);
    Object.assign(this.sheen.style, { left: '0px', top: '0px', width: '120px', height: this.Hh + 'px', background: 'linear-gradient(90deg, rgba(255,255,255,0), rgba(255,235,210,.75), rgba(255,255,255,0))', mixBlendMode: 'overlay' });
    this.hwrap.style.overflow = 'hidden';
    // lockup
    this.wmWrap = div('abs', this.cam);
    Object.assign(this.wmWrap.style, { width: '1920px', height: '200px', overflow: 'visible' });
    this.wm = div('s3-word', this.wmWrap);
    this.wm.style.fontSize = '156px';
    this.wmc = splitChars(this.wm, 'Heyden');
    this.tag = div('s3-sub', this.cam);
    this.tag.style.fontSize = '44px';
    this.tagW = splitWords(this.tag, 'Ideas to Outcomes', false);
    this.cta = div('cta', this.cam);
    el('span', '', this.cta, 'Get started');
    this.arrow = el('span', '', this.cta, '→');
    this.arrow.style.display = 'inline-block';
    this.url = div('abs', this.cam, 'heyden.ai');
    Object.assign(this.url.style, { fontSize: '38px', fontWeight: 600, letterSpacing: '-.01em', color: 'rgba(255,255,255,.92)', whiteSpace: 'nowrap' });
    const cw = this.cta.getBoundingClientRect().width, uw = this.url.getBoundingClientRect().width;
    const gap = 40, rowW = cw + gap + uw;
    this.ctaX = 960 - rowW / 2;
    this.urlX = this.ctaX + cw + gap;
    this.ctaSheen = div('abs', this.cta);
    Object.assign(this.ctaSheen.style, { left: '0px', top: '0px', width: '90px', height: '76px', background: 'linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,.55), rgba(255,255,255,0))' });
    this.cta.style.overflow = 'hidden';
  },
  mb(t) { return t < 24.2 || (t > 25.3 && t < 26.35) ? 8 : 4; },
  update(t, imgs, api) {
    const lt = t - 24.0;
    // footage of crews on the fire ground, low behind the type
    const fc = this.fc;
    const fa = clamp(inv(23.9, 24.1, t)) * (1 - clamp(inv(25.2, 25.75, t)));
    if (fa > 0 && imgs.crews) {
      const z = lerp(1.12, 1.2, inv(23.9, 25.9, t));
      fc.save();
      fc.filter = 'contrast(1.15) saturate(0.75) brightness(0.62)';
      fc.drawImage(imgs.crews, 960 - 960 * z, 540 - 540 * z + 30, 1920 * z, 1080 * z);
      fc.restore();
    } else fc.clearRect(0, 0, 1920, 1080);
    setO(this.fcv, fa * 0.55);
    setO(this.warm, 0.6 + 0.4 * clamp(inv(25.6, 26.2, t)));

    const push = lerp(1, 1.035, E.inOutQuad(inv(24.0, 25.4, t))) * lerp(1, 1.04, E.inOutQuad(inv(26.2, 30.0, t)));
    setT(this.cam, `scale(${push.toFixed(5)})`);
    this.cam.style.transformOrigin = '960px 540px';

    const ec = this.ec;
    ec.clearRect(0, 0, 1920, 1080);
    api.drawEmbers(ec, t, { count: 70, seed: 12, speed: [40, 150], size: [0.8, 2.6], alpha: 0.9, drift: 70 });

    // ---- "Ideas to Outcomes": arrives on the downbeat
    const H = this.H, Hh = this.Hh;
    const cx = 960, cy = 540;
    const stemL = cx - H.w / 2 + H.s / 2, stemR = cx + H.w / 2 - H.s / 2;
    const arr = E.outExpo(inv(23.9, 24.18, t));
    const mo = E.inOutQuart(inv(25.32, 25.82, t));
    const solid = E.inOutCubic(inv(25.66, 25.9, t));
    const baseY = 540 - 88;
    // Ideas -> left stem
    {
      const i = 0, w = this.w[i];
      const x0 = this.wx[i] + (1 - arr) * -700, y0 = baseY;
      const tx = stemL - w / 2, ty = cy - 88;
      const sc = lerp(1, Hh / w, mo);
      const x = lerp(x0, tx, mo), y = lerp(y0, ty, mo);
      setT(this.wI, `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0) rotate(${(-90 * mo).toFixed(3)}deg) scale(${sc.toFixed(4)}, ${(sc * lerp(1, 0.8, mo)).toFixed(4)})`);
      setO(this.wI, clamp(inv(23.9, 23.96, t)) * (1 - solid));
    }
    // Outcomes -> right stem
    {
      const i = 2, w = this.w[i];
      const x0 = this.wx[i] + (1 - arr) * 700, y0 = baseY;
      const tx = stemR - w / 2, ty = cy - 88;
      const sc = lerp(1, Hh / w, mo);
      const x = lerp(x0, tx, mo), y = lerp(y0, ty, mo);
      setT(this.wO, `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0) rotate(${(-90 * mo).toFixed(3)}deg) scale(${sc.toFixed(4)}, ${(sc * lerp(1, 1.25, mo)).toFixed(4)})`);
      setO(this.wO, clamp(inv(23.9, 23.96, t)) * (1 - solid));
    }
    // to -> crossbar
    {
      const i = 1, w = this.w[i];
      const y0 = baseY + (1 - arr) * -300;
      const x = lerp(this.wx[i], cx - w / 2, mo), y = lerp(y0, cy - 88 + (HM.barTop + HM.barH / 2 - 0.5) * Hh, mo);
      setT(this.wT, `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0) scale(${lerp(1, 0.7, mo).toFixed(4)})`);
      setO(this.wT, clamp(inv(23.94, 24.0, t)) * (1 - E.inQuad(inv(25.55, 25.8, t))));
    }
    // the mark assembles: stems solidify out of the rotated words, the bar shoots across on the hit
    const hs = t < 26.0 ? 1 : 1.12 - 0.12 * spring(t - 26.0, 2.2, 6.5);
    const lift = E.inOutQuart(inv(26.28, 26.72, t));
    const hy = lerp(cy, 298, lift);
    const hsc = hs * lerp(1, 0.42, lift);
    setT(this.hwrap, `translate3d(${(cx - H.w / 2).toFixed(2)}px, ${(hy - H.h / 2).toFixed(2)}px, 0) scale(${hsc.toFixed(5)})`);
    this.hwrap.style.transformOrigin = '50% 50%';
    show(this.hwrap, t > 25.6);
    setO(H.L, solid); setO(H.R, solid);
    setT(H.L, `scaleY(${lerp(0.9, 1, solid).toFixed(4)})`);
    setT(H.R, `scaleY(${lerp(0.9, 1, solid).toFixed(4)})`);
    const bar = E.outExpo(inv(25.8, 26.0, t));
    setT(H.B, `scaleX(${bar.toFixed(4)})`);
    H.B.style.transformOrigin = '50% 50%';
    setO(H.B, bar > 0 ? 1 : 0);
    const glow = t < 26 ? 0.3 * solid : lerp(1, 0.4, E.outCubic(inv(26.0, 27.0, t))) + 0.08 * Math.sin(t * 2.4);
    this.hwrap.style.filter = `drop-shadow(0 0 ${(30 + 40 * glow).toFixed(1)}px rgba(255,70,20,${clamp(glow).toFixed(3)}))`;
    // sheen across the mark
    const shp = inv(27.7, 28.25, t);
    setT(this.sheen, `translateX(${lerp(-140, H.w + 20, E.inOutCubic(shp)).toFixed(1)}px) skewX(-18deg)`);
    setO(this.sheen, shp > 0 && shp < 1 ? 1 : 0);

    // impact ring + sparks at 26.0
    const rp = inv(26.0, 26.8, t);
    const R = lerp(60, 1400, E.outCubic(rp));
    this.ring.style.width = this.ring.style.height = R * 2 + 'px';
    this.ring.style.borderWidth = lerp(8, 1, rp) + 'px';
    setT(this.ring, `translate(${cx - R}px, ${cy - R}px)`);
    setO(this.ring, rp > 0 && rp < 1 ? (1 - rp) * 0.85 : 0);
    const bc = this.bc;
    bc.clearRect(0, 0, 1920, 1080);
    api.drawBurst(bc, t - 26.0, { cx, cy, count: 130, seed: 9, speed: [400, 2000], life: [0.5, 1.6], size: [1.2, 3.6] });

    // lockup
    setT(this.wmWrap, `translate(0px, 412px)`);
    this.wmc.forEach((ch, i) => {
      const T = 26.62 + i * 0.03;
      const p = E.outExpo(inv(T, T + 0.6, t));
      setT(ch, `translate3d(0, ${((1 - p) * 120).toFixed(1)}px, 0)`);
      setO(ch, clamp(p * 1.4));
    });
    setT(this.tag, `translate(0px, 606px)`);
    this.tagW.forEach((w, i) => {
      const T = 27.0 + i * 0.07;
      const p = E.outCubic(inv(T, T + 0.45, t));
      setT(w, `translate3d(0, ${((1 - p) * 24).toFixed(1)}px, 0)`);
      setO(w, p);
    });
    const cp = E.outBack(inv(27.22, 27.62, t));
    setT(this.cta, `translate3d(${this.ctaX.toFixed(1)}px, ${(716 + (1 - cp) * 20).toFixed(1)}px, 0) scale(${lerp(0.8, 1, cp).toFixed(4)})`);
    setO(this.cta, clamp(inv(27.22, 27.34, t)));
    const nud = Math.max(0, Math.sin(clamp(inv(28.3, 28.7, t)) * Math.PI)) + Math.max(0, Math.sin(clamp(inv(29.3, 29.7, t)) * Math.PI));
    setT(this.arrow, `translateX(${(8 * nud).toFixed(2)}px)`);
    const csp = inv(28.55, 29.05, t);
    setT(this.ctaSheen, `translateX(${lerp(-120, 420, E.inOutCubic(csp)).toFixed(1)}px) skewX(-18deg)`);
    setO(this.ctaSheen, csp > 0 && csp < 1 ? 1 : 0);
    const up = E.outCubic(inv(27.36, 27.8, t));
    setT(this.url, `translate3d(${(this.urlX + (1 - up) * 20).toFixed(1)}px, ${(734).toFixed(1)}px, 0)`);
    setO(this.url, up);
  },
};
