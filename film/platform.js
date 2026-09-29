// The Heyden platform as a live DOM app: one window, the product's own top navigation, four complete pages.
// Every label is taken from ../brand (site copy, product screenshots, the product's stylesheet). Numbers and project
// data follow the product screenshots' demo workspace. Organisation names are deliberately generic.
import { div, el } from './lib.js';

export const WIN_W = 1600, WIN_H = 1000, TOP_H = 60;

// ------------------------------------------------------------------ icons (hand-drawn, 24px grid)
const I = {
  commons: '<path d="M6 3.5h11.5a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H6a1.5 1.5 0 0 1-1.5-1.5V5A1.5 1.5 0 0 1 6 3.5z"/><circle cx="11.8" cy="10" r="2.6"/><path d="M7.8 16.6c.7-2 2.2-3.1 4-3.1s3.3 1.1 4 3.1"/>',
  qa: '<rect x="3.5" y="3.5" width="17" height="17" rx="4"/><path d="M12 16.2V8.2M8.6 11.4 12 8l3.4 3.4"/>',
  projects: '<rect x="3.5" y="4" width="17" height="16" rx="3"/><path d="M3.5 9.5h17M9.5 9.5V20"/>',
  strategy: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.6"/><circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none"/>',
  sparkle: '<path d="M11 3.5l1.8 5.2 5.2 1.8-5.2 1.8L11 17.5l-1.8-5.2L4 10.5l5.2-1.8z"/><path d="M19 3v4M17 5h4M18.5 16v4M16.5 18h4"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.6-3.6"/>',
  bell: '<path d="M6 16.5V11a6 6 0 1 1 12 0v5.5l1.5 1.5h-15z"/><path d="M10 20.5a2.2 2.2 0 0 0 4 0"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  filter: '<path d="M4 5h16l-6.2 7.6V18l-3.6 2v-7.4z"/>',
  chevDown: '<path d="M6 9l6 6 6-6"/>',
  chevRight: '<path d="M9 6l6 6-6 6"/>',
  globe: '<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.3 2.5 3.5 5.3 3.5 8.5s-1.2 6-3.5 8.5c-2.3-2.5-3.5-5.3-3.5-8.5s1.2-6 3.5-8.5z"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  crown: '<path d="M4 17.5h16M4.5 17.5 3.5 7l5 4 3.5-6 3.5 6 5-4-1 10.5"/>',
  archive: '<rect x="3.5" y="4.5" width="17" height="5" rx="1.2"/><path d="M5.5 9.5v9.5h13V9.5M10 13.5h4"/>',
  pencil: '<path d="M4.5 19.5h4l10-10-4-4-10 10z"/>',
  check: '<path d="M5 12.5l4.2 4.2L19 7"/>',
  link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
  users: '<circle cx="9" cy="8.5" r="3.2"/><path d="M3.5 19c.8-3.3 3-5 5.5-5s4.7 1.7 5.5 5"/><circle cx="16.8" cy="9.2" r="2.6"/><path d="M15.6 14.3c2.5.1 4.2 1.7 4.9 4.7"/>',
  building: '<rect x="5" y="3.5" width="10" height="17" rx="1.2"/><path d="M15 9h4v11.5h-4M8 7.5h1M11 7.5h1M8 11h1M11 11h1M8 14.5h1M11 14.5h1"/>',
  file: '<path d="M6 3.5h8l4 4v13H6z"/><path d="M14 3.5v4h4M9 13h6M9 16.5h6"/>',
  radar: '<circle cx="12" cy="12" r="8.5"/><path d="M12 12 18 6"/><circle cx="12" cy="12" r="4.5"/>',
  chart: '<path d="M4 20V4M4 20h16M8.5 16v-5M13 16V8M17.5 16v-3"/>',
  flame: '<path d="M12 21c-3.9 0-6.5-2.6-6.5-6.2 0-3.3 2.3-5.2 3.7-7.9.4 1.8 1.4 2.8 2.6 3.4-.3-3.3 1.1-5.9 3.3-7.8.3 3.5 1.9 5.4 3.1 7.4a7.6 7.6 0 0 1 .3 5c-.8 3.5-3.5 6.1-6.5 6.1z"/>',
  shield: '<path d="M12 3.5l7 2.8v5.4c0 4.4-2.9 7.5-7 8.8-4.1-1.3-7-4.4-7-8.8V6.3z"/>',
  target: '<circle cx="12" cy="12" r="8.5"/><path d="M12 3.5v4M12 16.5v4M3.5 12h4M16.5 12h4"/>',
  layers: '<path d="M12 4 3.5 8.5 12 13l8.5-4.5z"/><path d="M3.5 12.5 12 17l8.5-4.5M3.5 16.5 12 21l8.5-4.5"/>',
  arrowR: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  dots: '<circle cx="6" cy="12" r="1.3" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.3" fill="currentColor" stroke="none"/><circle cx="18" cy="12" r="1.3" fill="currentColor" stroke="none"/>',
};
export const svg = (name, sw = 1.8) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round">${I[name]}</svg>`;
const CURSOR = '<svg viewBox="0 0 28 36" width="28" height="36"><path d="M3.5 2.5 L3.5 28.5 L10 22.6 L14.6 33.2 L19.6 31 L15 20.7 L23.8 20.3 Z" fill="#fff" stroke="#0B0B0B" stroke-width="1.7" stroke-linejoin="round"/></svg>';

// ------------------------------------------------------------------ helpers
function A(parent, cls, x, y, w, h, text) {
  const e = div(cls ? 'a ' + cls : 'a', parent, text);
  e.style.left = x + 'px'; e.style.top = y + 'px';
  if (w != null) e.style.width = w + 'px';
  if (h != null) e.style.height = h + 'px';
  return e;
}
function ico(parent, name, size, x, y, color, sw) {
  const e = A(parent, '', x, y, size, size);
  e.innerHTML = svg(name, sw);
  e.firstChild.style.width = e.firstChild.style.height = size + 'px';
  if (color) e.style.color = color;
  return e;
}
function withIcon(e, name, first = true) {
  const s = el('span', '', null);
  s.innerHTML = svg(name);
  s.style.display = 'flex';
  if (first) e.prepend(s); else e.appendChild(s);
  return s;
}
function tag(parent, cls, text, iconName) {
  const t = el('span', 'hy-tag ' + cls, parent);
  if (iconName) withIcon(t, iconName);
  el('span', '', t, text);
  return t;
}
function av(parent, letter, tone = '', x, y, size) {
  const a = div('hy-av ' + tone, parent, letter);
  if (x != null) { a.style.left = x + 'px'; a.style.top = y + 'px'; }
  if (size) { a.style.width = a.style.height = size + 'px'; a.style.fontSize = Math.round(size * 0.43) + 'px'; }
  return a;
}

// ------------------------------------------------------------------ window + top bar
const NAV = [['commons', 'Commons'], ['qa', 'Quick Assessment'], ['projects', 'Projects'], ['strategy', 'Strategy Hub']];

export function buildPlatform(parent) {
  const P = { pages: {} };
  const root = div('hy', parent);
  root.style.position = 'absolute'; root.style.left = '0px'; root.style.top = '0px';
  root.style.width = WIN_W + 'px'; root.style.height = WIN_H + 'px';
  P.root = root;
  P.shadow = div('hy-win-shadow', root);
  const win = div('hy-win', root);
  P.win = win;

  // pages first (under the top bar)
  P.pages.projects = buildProjects(win);
  P.pages.qa = buildQA(win);
  P.pages.strategy = buildStrategy(win);
  P.pages.commons = buildCommons(win);

  // top bar
  const tb = div('hy-topbar', win);
  P.topbar = tb;
  const brand = div('hy-brand', tb);
  div('mk', brand, 'H');
  div('wm', brand, 'Heyden');
  const nav = div('hy-nav', tb);
  P.navPill = div('hy-nav-pill', nav);
  P.navBar = div('hy-nav-bar', nav);
  P.nav = {};
  NAV.forEach(([k, label]) => {
    const it = div('it', nav);
    withIcon(it, k);
    el('span', '', it, label);
    P.nav[k] = it;
  });
  const tr = div('hy-tr', tb);
  const sb = div('hy-ib', tr); sb.innerHTML = svg('search');
  const ask = div('hy-ask', tr); withIcon(ask, 'sparkle'); el('span', '', ask, 'Ask Heyden');
  P.topAsk = ask;
  const bell = div('hy-ib', tr); bell.innerHTML = svg('bell'); div('dot', bell);
  const me = div('hy-me', tr);
  av(me, 'C', 's');
  const who = div('', me);
  div('nm', who, 'Connor');
  div('org', who, 'Agency workspace');

  P.rim = div('hy-win-rim', win);
  P.sheen = div('hy-sheen', win);
  // cursor + click ring live above everything inside the window
  P.click = div('hy-click', win);
  P.cursor = div('hy-cursor', win);
  P.cursor.innerHTML = CURSOR;
  return P;
}

// measured after fonts load: nav item boxes in window space
export function navGeometry(P) {
  const base = P.win.getBoundingClientRect();
  const g = {};
  for (const k in P.nav) {
    const r = P.nav[k].getBoundingClientRect();
    g[k] = { x: r.left - base.left, y: r.top - base.top, w: r.width, h: r.height };
  }
  return g;
}

// ------------------------------------------------------------------ Projects (Collaborate)
export const STAGES = [
  ['Define Problem', 'b'], ['Identify Stakeholders', 'b'], ['Stakeholder validation', 'b'], ['Readiness (TRL / IRL / ORL)', 'o'],
  ['Business Case', 'p'], ['Implement', 't'], ['Measure Success', 't'],
];
const SC = {
  b: { lab: '#7DB0D2', ring: 'rgba(111,163,194,.55)', fill: 'rgba(66,129,164,.16)', num: '#A9CDE4', chip: 'rgba(66,129,164,.13)', chipB: 'rgba(111,163,194,.42)', chipT: '#BFDCEE' },
  o: { lab: '#FDA04A', ring: 'rgba(251,139,36,.65)', fill: 'rgba(251,139,36,.16)', num: '#FFC58C', chip: 'rgba(251,139,36,.12)', chipB: 'rgba(251,139,36,.48)', chipT: '#FFD2A6' },
  p: { lab: '#CBAABC', ring: 'rgba(180,134,159,.55)', fill: 'rgba(180,134,159,.14)', num: '#E2C8D6', chip: 'rgba(180,134,159,.12)', chipB: 'rgba(180,134,159,.42)', chipT: '#EAD6E1' },
  t: { lab: '#8CC2BE', ring: 'rgba(114,168,165,.55)', fill: 'rgba(54,130,127,.16)', num: '#B6DEDA', chip: 'rgba(54,130,127,.13)', chipB: 'rgba(114,168,165,.42)', chipT: '#C8E7E4' },
};
export { SC as STAGE_COLOURS };

function buildProjects(win) {
  const pg = div('hy-page', win);
  const S = div('hy-scroll', pg);
  const H = { page: pg, scroll: S };
  // header
  H.head = A(S, '', 44, 30, 900, 90);
  A(H.head, 'hy-kick', 0, 0, null, null, 'PROJECTS');
  const h1 = A(H.head, 'hy-h1', 0, 22);
  h1.innerHTML = 'Welcome back, <span style="color:#F0703A">Connor</span>';
  A(H.head, 'hy-sub', 0, 66, null, null, 'Shared project workspaces across agencies');
  H.team = A(S, 'hy-stack', 1180, 50);
  [['C', ''], ['M', 'o'], ['J', 't'], ['R', 'r']].forEach(([l, t]) => av(H.team, l, t, null, null, 34));
  H.team.style.setProperty('--ring', '#151515');
  const nb = A(S, 'hy-btn', 1396, 46, 160, 42);
  withIcon(nb, 'plus');
  el('span', '', nb, 'New Project');
  H.newBtn = nb;

  // pipeline
  const pp = A(S, 'hy-card', 44, 138, 1512, 282);
  H.pipe = pp;
  A(pp, 'hy-h2', 26, 22, null, null, 'Project Pipeline');
  A(pp, 'hy-meta', 26, 48, null, null, 'See how your projects are progressing');
  const fb = A(pp, 'hy-ghost', 1340, 20, null, null);
  withIcon(fb, 'filter'); el('span', '', fb, 'All projects');
  const colW = (1512 - 52) / 7;
  H.colW = colW;
  H.stages = STAGES.map(([name, k], i) => {
    const cx = 26 + colW * i + colW / 2;
    const c = SC[k];
    const line = i < 6 ? A(pp, 'pj-line', cx + 26, 112, colW - 52, 2) : null;
    const node = A(pp, 'pj-node', cx - 17, 96, 34, 34, String(i + 1));
    Object.assign(node.style, { background: c.fill, color: c.num, boxShadow: `inset 0 0 0 1.5px ${c.ring}` });
    const lab = A(pp, 'pj-lab', cx, 140, null, null, name);
    lab.style.color = c.lab;
    return { cx, node, lab, line, c };
  });
  H.fill = A(pp, 'pj-fill', H.stages[0].cx, 112, 0, 2);
  // lanes: placeholder slots, then project chips
  H.lanes = [];
  for (let i = 0; i < 7; i++) {
    const cx = H.stages[i].cx;
    H.lanes.push(A(pp, 'pj-lane', cx - 92, 186, 184, 64, '—'));
  }
  const chip = (i, title, meta, who, ext) => {
    const k = STAGES[i][1], c = SC[k];
    const e = A(pp, 'pj-chip', H.stages[i].cx - 92, 186);
    Object.assign(e.style, { background: c.chip, boxShadow: `inset 0 0 0 1.5px ${c.chipB}` });
    const t = div('t', e, title); t.style.color = c.chipT;
    const m = div('m', e); withIcon(m, ext ? 'globe' : 'clock'); el('span', '', m, meta);
    div('w', e, who);
    return e;
  };
  H.chips = [
    { e: chip(0, 'Firefighter Wearables', '7 days', 'EXT', true), stage: 0 },
    { e: chip(1, 'Stratoship — Stratospheric…', '1 day', 'MY'), stage: 1 },
    { e: chip(3, 'Camera Detection - Smoke', '4 days', 'MY'), stage: 3 },
  ];
  H.lanes[0].style.opacity = 0; H.lanes[1].style.opacity = 0; H.lanes[3].style.opacity = 0;

  // my projects
  H.sec1 = A(S, 'hy-h2', 44, 450);
  withIcon(H.sec1, 'chevDown'); el('span', '', H.sec1, 'My Projects'); el('span', 'ct', H.sec1, '2');
  const pcard = (x, y, d) => {
    const c = A(S, 'hy-card pj-card', x, y, 492, 170);
    if (d.owner) ico(c, 'crown', 15, 22, 24, '#E08A2E', 2);
    av(c, 'C', '', d.owner ? 44 - 4 + 0 : 22, 19, 26);
    c.lastChild.style.left = (d.owner ? 26 + 18 : 22) + 'px';
    const tt = div('tt', c, d.t);
    tt.style.left = (d.owner ? 84 : 60) + 'px';
    if (d.editor) { const b = A(c, '', 380, 21); tag(b, 'editor', 'editor', 'pencil'); }
    const r1 = A(c, 'pj-row', 22, 64); const pct = el('span', '', r1, d.pct + '% complete'); el('span', '', r1, d.stage);
    const tr = A(c, 'hy-track', 22, 88, 448, 6); const fill = el('i', '', tr); fill.style.width = d.pct + '%';
    const r2 = A(c, 'pj-row', 22, 106); const l2 = el('span', 'l', r2); withIcon(l2, 'clock'); el('span', '', l2, d.days); el('span', '', r2, d.upd);
    const ft = div('pj-foot', c);
    const fl = A(ft, 'hy-meta', 22, 15, null, null, d.foot);
    if (d.footIcon) withIcon(fl, d.footIcon);
    const st = A(ft, 'hy-stack', 380, 10);
    d.team.forEach(([l, t]) => av(st, l, t, null, null, 26));
    return { c, fill, pct, target: d.pct, stack: st };
  };
  H.cards = [
    pcard(44, 486, { owner: true, t: 'Camera Detection - Smoke', pct: 46, stage: 'Readiness (TRL / IRL / ORL)', days: '4 days in stage', upd: 'Updated 24 Sept 2026', foot: 'Created 4 June 2026', team: [['C', ''], ['M', 'o'], ['J', 't']] }),
    pcard(552, 486, { owner: true, t: 'Stratoship — Stratospheric Airship…', pct: 22, stage: 'Identify Stakeholders', days: '1 day in stage', upd: 'Updated 26 Sept 2026', foot: 'Created 12 May 2026', team: [['C', ''], ['R', 'r']] }),
  ];
  H.sec2 = A(S, 'hy-h2', 44, 686);
  withIcon(H.sec2, 'chevDown'); withIcon(H.sec2, 'globe', false); el('span', '', H.sec2, 'External Organisations Projects'); el('span', 'ct', H.sec2, '1');
  H.sec2.children[1].style.order = 0;
  H.ext = pcard(44, 722, { t: 'Firefighter Wearables', editor: true, pct: 8, stage: 'Define Problem', days: '7 days in stage', upd: 'Updated 21 Sept 2026', foot: 'Shared by a partner agency', footIcon: 'link', team: [['R', 'r'], ['C', '']] });
  H.sec3 = A(S, 'hy-h2', 552, 686);
  withIcon(H.sec3, 'chevRight'); withIcon(H.sec3, 'archive', false); el('span', '', H.sec3, 'Archived projects'); el('span', 'ct', H.sec3, '2');
  const arc = A(S, '', 552, 722, 492, 170);
  H.arc = arc;
  Object.assign(arc.style, { borderRadius: '16px', border: '1.5px dashed rgba(255,255,255,.10)' });
  ico(arc, 'archive', 22, 24, 24, 'rgba(255,255,255,.45)');
  const at = A(arc, '', 60, 24, 400, null, 'These projects are removed from your dashboard and pipeline while archived. Data is kept for audit; restore anytime to continue working.');
  at.style.cssText += 'font-size:13.5px;line-height:21px;color:rgba(255,255,255,.6)';
  const rb = A(arc, 'hy-ghost', 60, 110, null, null); withIcon(rb, 'chevRight'); el('span', '', rb, 'Show archived');

  // workspace panel: multi-agency tenancy + approval roles
  const ws = A(S, 'hy-card', 1060, 450, 496, 442);
  H.ws = ws;
  const wh = A(ws, 'hy-h2', 24, 22); withIcon(wh, 'users'); el('span', '', wh, 'Workspace');
  A(ws, 'hy-meta', 24, 50, null, null, 'Multi-agency tenancy');
  const inv = A(ws, 'hy-ghost', 0, 18, null, null); withIcon(inv, 'plus'); el('span', '', inv, 'Invite your team'); inv.style.left = 'auto'; inv.style.right = '22px';
  H.invite = inv;
  A(ws, 'hy-kick mute', 24, 92, null, null, 'AGENCIES');
  const org = (y, mono, tone, name, sub, right) => {
    const r = A(ws, '', 24, y, 448, 52);
    const lg = A(r, '', 0, 4, 42, 42);
    Object.assign(lg.style, { borderRadius: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: tone[0], boxShadow: `inset 0 0 0 1px ${tone[1]}`, color: tone[2] });
    lg.innerHTML = svg(mono); lg.firstChild.style.width = lg.firstChild.style.height = '21px';
    A(r, '', 56, 6, null, null, name).style.cssText += 'font-size:14.5px;font-weight:650;white-space:nowrap';
    A(r, 'hy-meta', 56, 28, null, null, sub);
    const rt = A(r, '', 360, 14); tag(rt, right[0], right[1]);
    rt.style.left = 'auto'; rt.style.right = '0px';
    return r;
  };
  H.orgs = [
    org(114, 'shield', ['rgba(251,139,36,.12)', 'rgba(251,139,36,.4)', '#FDA04A'], 'Your agency', '3 members', ['warn', 'Owner']),
    org(174, 'flame', ['rgba(66,129,164,.14)', 'rgba(111,163,194,.4)', '#8EC0DF'], 'Partner agency', '2 members', ['editor', 'Editor']),
  ];
  A(ws, 'hy-hr', 24, 244, 448, 1);
  A(ws, 'hy-kick mute', 24, 266, null, null, 'APPROVALS');
  H.roles = [['C', '', 'Connor', 'Your agency', 'drafter', 'Drafter'], ['M', 'o', 'Program lead', 'Your agency', 'reviewer', 'Reviewer'], ['R', 'r', 'Operations', 'Partner agency', 'approver', 'Approver']].map(([l, t, n, o, rc, rl], i) => {
    const r = A(ws, '', 24, 292 + i * 48, 448, 40);
    const a = av(r, l, t, 0, 6, 30);
    A(r, '', 44, 3, null, null, n).style.cssText += 'font-size:14px;font-weight:600;white-space:nowrap';
    A(r, 'hy-meta', 44, 22, null, null, o).style.fontSize = '12px';
    const rr = A(r, '', 0, 8); const rs = el('span', 'hy-role ' + rc, rr, rl); rr.style.left = 'auto'; rr.style.right = '0px';
    return r;
  });
  return H;
}

// ------------------------------------------------------------------ Quick Assessment (Innovate)
export const QA_TEXT = 'The vendor has offered this platform as a services model.';
function buildQA(win) {
  const pg = div('hy-page', win);
  const S = div('hy-scroll', pg);
  const H = { page: pg, scroll: S };
  const MX = 60, MW = 1040; // main column
  H.kick = A(S, 'hy-kick', MX, 44, MW); H.kick.textContent = 'PROPOSAL ASSESSMENT'; H.kick.style.textAlign = 'center';
  H.h1 = A(S, 'hy-h1', MX, 68, MW); H.h1.textContent = 'What have the good idea fairies come up with today?'; H.h1.style.textAlign = 'center';
  // input shell
  const sh = A(S, 'qa-shell', MX, 136, MW, 212);
  H.shell = sh;
  H.text = div('qa-text', sh);
  H.typed = el('span', '', H.text);
  H.caret = el('span', 'qa-caret', H.text);
  H.ph = el('span', 'qa-ph', H.text, 'Paste a proposal, or describe what a vendor is offering…');
  A(sh, 'hy-hr', 0, 142, MW, 1);
  H.plus = A(sh, 'qa-plus', 18, 156); H.plus.innerHTML = svg('plus');
  H.file = A(sh, 'qa-file', 66, 156);
  const fi = div('ic', H.file); fi.innerHTML = svg('file', 2);
  el('span', '', H.file, 'Vendor proposal.pdf');
  el('span', 'sz', H.file, '2.4 MB');
  H.btn = A(sh, 'hy-btn', MW - 18 - 190, 155, 190, 42);
  H.spark = withIcon(H.btn, 'sparkle');
  el('span', '', H.btn, 'Assess proposal');
  H.btnC = { x: MX + MW - 18 - 95, y: 136 + 155 + 21 };

  // research progress (between click and brief)
  H.prog = A(S, '', MX, 372, MW, 40);
  const pl = A(H.prog, 'hy-meta', 0, 0, null, null, 'Assessing the proposal…');
  pl.style.color = '#9CC6E0'; withIcon(pl, 'sparkle');
  H.progBar = A(H.prog, 'research-bar', 0, 30, MW, 4); H.progI = el('i', '', H.progBar);

  // the brief
  const B = A(S, 'hy-card', MX, 372, MW, 520);
  H.brief = B;
  const bh = A(B, '', 26, 22, 700, 60);
  A(bh, 'hy-kick', 0, 0, null, null, 'ASSESSMENT');
  A(bh, '', 0, 20, null, null, 'Services-model platform proposal').style.cssText += 'font-size:21px;font-weight:650;letter-spacing:-.015em;white-space:nowrap';
  const saved = A(B, '', MW - 26 - 104 - 14 - 76, 29); tag(saved, 'ok', 'Saved', 'check'); H.saved = saved;
  const shb = A(B, 'hy-ghost', MW - 26 - 104, 22, null, null); withIcon(shb, 'link'); el('span', '', shb, 'Share');
  H.share = shb;
  A(B, 'hy-hr', 26, 96, MW - 52, 1);
  A(B, 'hy-kick mute', 26, 116, null, null, 'READINESS');
  const PW = (MW - 52 - 2 * 16) / 3;
  H.panels = [['trl', 'TRL', '6', 'Technology readiness', '#F0795C', 6], ['irl', 'IRL', '4', 'Integration readiness', '#8EC0DF', 4], ['orl', 'ORL', '3', 'Operational readiness', '#8CC2BE', 3]].map(([k, lab, n, d, col, lv], i) => {
    const p = A(B, 'rd-panel ' + k, 26 + i * (PW + 16), 142, PW, 112);
    const kk = div('k', p, lab); kk.style.color = col;
    const nn = div('n', p, n); nn.style.color = '#fff';
    div('d', p, d);
    const seg = div('rd-seg', p);
    const segs = [];
    for (let s = 0; s < 9; s++) { const it = el('i', '', seg); segs.push(it); }
    return { p, n: nn, segs, lv, col };
  });
  // TRL scale with phase bands, declared vs assessor
  A(B, 'hy-kick mute', 26, 280, null, null, 'TECHNOLOGY READINESS LEVEL');
  const SX = 26, SW = MW - 52, cw = (SW - 8 * 8) / 9;
  H.cells = [];
  [['research', 'RESEARCH', 0], ['development', 'DEVELOPMENT', 3], ['deployment', 'DEPLOYMENT', 6]].forEach(([k, lab, i0]) => {
    A(B, 'trl-band ' + k, SX + i0 * (cw + 8), 306, cw * 3 + 16, 26, lab);
  });
  for (let i = 0; i < 9; i++) {
    const c = A(B, 'trl-cell', SX + i * (cw + 8), 338, cw, 46, String(i + 1));
    H.cells.push(c);
  }
  H.cellGeo = { SX, cw };
  H.bDecl = A(B, 'trl-badge ghost', 0, 394, null, null, 'Declared 7');
  H.bAss = A(B, 'trl-badge', 0, 394, null, null, 'Assessor 6');
  const callout = A(B, '', 26, 446, SW, 50);
  Object.assign(callout.style, { borderRadius: '12px', background: 'rgba(251,139,36,.07)', boxShadow: 'inset 0 0 0 1px rgba(251,139,36,.25)' });
  const ct = A(callout, 'hy-meta', 16, 15, null, null, 'Assessed one level below the vendor’s declared TRL. Evidence reviewed: vendor proposal.');
  ct.style.color = 'rgba(255,255,255,.82)'; ct.style.gap = '10px'; const ci = withIcon(ct, 'shield'); ci.style.color = '#FDA04A'; ci.firstChild.style.width = ci.firstChild.style.height = '17px';
  H.callout = callout;

  // sidebar
  const SXb = 1140, SWb = 416;
  const side = A(S, '', SXb, 44, SWb, 860);
  H.side = side;
  A(side, 'hy-kick', 0, 0, null, null, 'ASSESSED PROJECTS');
  H.empty1 = A(side, 'hy-meta', 0, 26, SWb, null, 'No saved assessments yet. Run “Assess proposal” to build history.');
  H.empty1.style.whiteSpace = 'normal'; H.empty1.style.lineHeight = '20px';
  const item = A(side, 'hy-card', 0, 26, SWb, 84);
  H.newItem = item;
  const ii = A(item, '', 16, 18, 40, 40);
  Object.assign(ii.style, { borderRadius: '11px', background: 'rgba(251,139,36,.12)', boxShadow: 'inset 0 0 0 1px rgba(251,139,36,.4)', color: '#FDA04A', display: 'flex', alignItems: 'center', justifyContent: 'center' });
  ii.innerHTML = svg('sparkle'); ii.firstChild.style.width = ii.firstChild.style.height = '20px';
  A(item, '', 68, 18, null, null, 'Services-model platform proposal').style.cssText += 'font-size:14.5px;font-weight:650;white-space:nowrap';
  const im = A(item, 'hy-meta', 68, 44); el('span', '', im, 'Just now'); el('span', '', im, '·'); el('span', '', im, 'TRL 6 · IRL 4 · ORL 3');
  A(side, 'hy-kick', 0, 150, null, null, 'SHARED WITH ME');
  const e2 = A(side, 'hy-meta', 0, 176, SWb, null, 'Nothing here yet. When a colleague shares an assessment link, open it while signed in — it will appear here for this organisation.');
  e2.style.whiteSpace = 'normal'; e2.style.lineHeight = '20px';
  A(side, 'hy-hr', 0, 262, SWb, 1);
  A(side, 'hy-kick mute', 0, 286, null, null, 'HOW IT WORKS');
  [['file', 'Drop in a vendor proposal'], ['sparkle', 'Heyden assesses its viability'], ['layers', 'Readiness scored: TRL · IRL · ORL'], ['link', 'Share the brief with your team']].forEach(([ic, t], i) => {
    const r = A(side, '', 0, 316 + i * 46, SWb, 38);
    const b = A(r, '', 0, 0, 36, 36);
    Object.assign(b.style, { borderRadius: '10px', background: 'rgba(255,255,255,.04)', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.09)', color: 'rgba(255,255,255,.7)', display: 'flex', alignItems: 'center', justifyContent: 'center' });
    b.innerHTML = svg(ic); b.firstChild.style.width = b.firstChild.style.height = '17px';
    A(r, '', 50, 9, null, null, t).style.cssText += 'font-size:14px;font-weight:500;color:rgba(255,255,255,.82);white-space:nowrap';
  });
  return H;
}

// ------------------------------------------------------------------ Strategy Hub (Strategise)
export const GAPS = [
  ['Early detection of new ignitions on high fire-danger days', 'Strategic direction · OBJ-04'],
  ['Shared situational awareness for incident controllers', 'Operations plan · OBJ-11'],
  ['Evidence-based evaluation of emerging technology', 'Annual report · OBJ-02'],
];
function buildStrategy(win) {
  const pg = div('hy-page', win);
  const S = div('hy-scroll', pg);
  const H = { page: pg, scroll: S };
  H.head = A(S, '', 44, 30, 900, 80);
  A(H.head, 'hy-h1', 0, 0, null, null, 'Strategy Hub');
  A(H.head, 'hy-sub', 0, 44, null, null, 'Align innovation projects with organisational strategy');
  const ex = A(S, 'hy-ghost', 1418, 36, null, null); withIcon(ex, 'file'); el('span', '', ex, 'Source Documents');
  ex.style.display = 'none';
  H.tabs = [['Dashboard', 44], ['Objectives', 160], ['Source Documents', 268]].map(([n, x], i) => A(S, 'sh-tab' + (i === 0 ? ' on' : ''), x, 118, null, null, n));
  A(S, 'hy-hr', 44, 150, 1512, 1);
  H.ul = A(S, '', 44, 148, 88, 3); Object.assign(H.ul.style, { background: 'var(--hy-orange)', borderRadius: '2px', boxShadow: '0 0 10px rgba(251,139,36,.6)' });
  const TW = (1512 - 3 * 18) / 4;
  H.tiles = [
    ['Total objectives', 124, '', '#fff', 'across 6 source documents', 'target'],
    ['Coverage', 0, '%', '#8EC0DF', '0 of 124 have aligned projects', 'chart'],
    ['Critical gaps', 105, '', '#EC5E52', 'critical/high with 0 projects', 'flame'],
    ['Active projects', 2, '', '#fff', '2 unaligned', 'projects'],
  ].map(([l, n, suf, col, sub, ic], i) => {
    const e = A(S, 'hy-card sh-tile', 44 + i * (TW + 18), 176, TW, 128);
    const ll = div('l', e); withIcon(ll, ic); el('span', '', ll, l);
    const num = div('n num', e, n + suf); num.style.color = col;
    const s = div('s', e, sub);
    return { e, num, n, suf, s, sub };
  });
  // coverage by source document
  const L = A(S, 'hy-card', 44, 322, 747, 262);
  H.panL = L;
  A(L, 'hy-kick mute', 22, 22, null, null, 'COVERAGE BY SOURCE DOCUMENT');
  const docs = [['Strategic Direction', 35], ['Operations Plan', 7], ['Annual Report 2024–25', 29], ['Equipment Planning Review', 6], ['Bush Fire Management Plan', 29], ['Parliamentary Submission', 18]];
  H.docs = docs.map(([n, c], i) => {
    const r = A(L, 'sh-docrow', 22, 50 + i * 34, 703, 34);
    div('nm', r, n);
    const tr = div('tr', r); const f = el('i', '', tr); f.style.width = '0%';
    const ct = div('ct', r, `0 / ${c}`);
    if (i < 5) A(L, 'hy-hr', 22, 50 + i * 34 + 34, 703, 1);
    return { r, f, ct, c };
  });
  // priority distribution
  const R = A(S, 'hy-card', 809, 322, 747, 262);
  H.panR = R;
  A(R, 'hy-kick mute', 22, 22, null, null, 'PRIORITY DISTRIBUTION');
  const seg = A(R, 'sh-seg', 747 - 22 - 182, 14); el('span', 'on', seg, 'Uncovered'); el('span', '', seg, 'Covered');
  const x0 = 122, x1 = 700, maxV = 76;
  H.chart = { x0, x1, maxV };
  for (let v = 0; v <= 76; v += 8) {
    const gx = x0 + (v / maxV) * (x1 - x0);
    A(R, 'sh-grid', gx, 58, 1, 160);
    const tk = A(R, 'hy-meta', gx - 10, 226, 20, null, String(v)); tk.style.fontSize = '11px'; tk.style.justifyContent = 'center';
  }
  H.bars = [['Critical', 29, '#D94B41'], ['High', 76, '#FB8B24'], ['Medium', 17, '#6FA3C2'], ['Low', 1, '#8C938F']].map(([n, v, c], i) => {
    const y = 66 + i * 38;
    A(R, 'sh-bl', x0 - 96, y + 2, 80, null, n);
    const b = A(R, 'sh-bar', x0, y, 0, 22); b.style.background = `linear-gradient(90deg, ${c}, ${c}E6)`; b.style.boxShadow = `0 0 18px ${c}40`;
    const bv = A(R, 'sh-bv', x0, y + 3, null, null, String(v));
    return { b, v, y, bv };
  });
  // highest priority gaps
  const G = A(S, 'hy-card', 44, 600, 1512, 326);
  H.panG = G;
  A(G, 'hy-kick mute', 22, 22, null, null, 'HIGHEST PRIORITY GAPS — CRITICAL OBJECTIVES WITH NO PROJECT COVERAGE');
  H.gaps = GAPS.map(([t, s], i) => {
    const g = A(G, 'sh-gap', 22, 54 + i * 90, 1468, 84);
    if (i > 0) A(G, 'hy-hr', 22, 54 + i * 90 - 4, 1468, 1);
    const p = A(g, '', 14, 16); tag(p, 'crit', 'Critical');
    div('t', g, t); div('s', g, s);
    const st = div('st', g, 'no aligned projects');
    const btn = A(g, 'hy-ghost', 1468 - 16 - 150, 22, null, null); withIcon(btn, 'link'); el('span', '', btn, 'Align project');
    const ok = A(g, '', 1468 - 16 - 230, 27); tag(ok, 'ok', 'Camera Detection - Smoke', 'check'); ok.style.opacity = 0;
    return { g, st, btn, ok };
  });
  // popover (project picker)
  const pop = A(S, 'sh-pop', 0, 0, 330, 176);
  H.pop = pop;
  A(pop, '', 16, 14, null, null, 'ALIGN A PROJECT').className = 'a h';
  H.popOpts = [['Camera Detection - Smoke', 'Readiness (TRL / IRL / ORL)', 'o'], ['Stratoship — Stratospheric…', 'Identify Stakeholders', 'b']].map(([t, s, k], i) => {
    const o = A(pop, 'o', 8, 40 + i * 58, 314, 50);
    const d = A(o, '', 12, 11, 26, 26);
    Object.assign(d.style, { borderRadius: '8px', background: SC[k].fill, boxShadow: `inset 0 0 0 1.5px ${SC[k].ring}`, color: SC[k].num, fontSize: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' });
    d.textContent = k === 'o' ? '4' : '2';
    div('t', o, t); div('s', o, s);
    return o;
  });
  return H;
}

// ------------------------------------------------------------------ Commons (Solve)
export const TRENDING = ['Situational Awareness', 'Forecasting & Prediction', 'Decision Support & Analytics', 'Response & Field Operations'];
export const ASK_Q = 'Who’s working on early warning & detection?';
const LISTINGS = [
  ['agency', 'AGENCY', 'State fire agency', 'Early Warning & Detection', 'Australia', 'shield', 't'],
  ['vendor', 'VENDOR', 'Detection camera network', 'Early Warning & Detection', 'United States', 'radar', 'v'],
  ['research', 'RESEARCHER', 'Fire behaviour research lab', 'Situational Awareness', 'Australia', 'layers', 'b'],
  ['industry', 'INDUSTRY BODY', 'Emergency services association', 'Decision Support & Analytics', 'Australia', 'users', 'o'],
  ['agency', 'AGENCY', 'Provincial wildfire service', 'Response & Field Operations', 'Canada', 'flame', 't'],
  ['vendor', 'VENDOR', 'Satellite fire detection', 'Early Warning & Detection', 'Canada', 'globe', 'v'],
];
function buildCommons(win) {
  const pg = div('hy-page', win);
  const S = div('hy-scroll', pg);
  const H = { page: pg, scroll: S };
  H.head = A(S, '', 44, 30, 900, 80);
  A(H.head, 'hy-h1', 0, 0, null, null, 'Commons');
  A(H.head, 'hy-sub', 0, 44, null, null, 'Search listings, agencies, industry bodies, products, and capabilities');
  // search
  const sb = A(S, 'cm-search', 44, 118, 1512, 64);
  H.search = sb;
  ico(sb, 'search', 20, 22, 22, 'rgba(255,255,255,.5)', 2);
  const q = div('q', sb);
  H.q = el('span', '', q); H.qCaret = el('span', 'qa-caret', q); H.qCaret.style.height = '22px';
  H.qPh = el('span', 'ph', q, 'Listing, product, capability, or ask Heyden anything...');
  const sbtn = A(sb, 'hy-btn', 1512 - 12 - 160 - 12 - 104, 11, 104, 42); el('span', '', sbtn, 'Search'); sbtn.style.padding = '0 18px';
  const sep = A(sb, '', 1512 - 12 - 160 - 7, 18, 1, 28); sep.style.background = 'rgba(255,255,255,.12)';
  H.ask = A(sb, 'cm-askbtn', 1512 - 12 - 160, 11, 160, 42); withIcon(H.ask, 'sparkle'); el('span', '', H.ask, 'Ask Heyden');
  H.askC = { x: 44 + 1512 - 12 - 80, y: 118 + 32 };
  // trending
  H.tk = A(S, 'hy-kick', 44, 206, null, null, 'TRENDING CAPABILITIES');
  const CW = (1512 - 3 * 16) / 4;
  H.trend = TRENDING.map((t, i) => { const c = A(S, 'cm-chip', 44 + i * (CW + 16), 232, CW); withIcon(c, ['radar', 'chart', 'layers', 'flame'][i]); el('span', '', c, t); return c; });
  // filters
  const fr = A(S, 'row', 44, 312, 1512, 34); fr.style.gap = '8px';
  H.fr = fr;
  const fk = el('span', 'hy-kick mute', fr, 'FILTER RESULTS'); fk.style.marginRight = '10px';
  H.fk = fk;
  H.filters = ['All', 'Agency', 'Vendor', 'Researcher', 'Industry body'].map((f, i) => el('span', 'cm-f' + (i === 0 ? ' on' : ''), fr, f));
  const sp = el('span', '', fr); sp.style.width = '18px';
  H.regions = [['Australia', 'AU'], ['United States', 'US'], ['Canada', 'CA']].map(([n, c]) => { const f = el('span', 'cm-f', fr); el('span', '', f, n); return f; });
  // ask heyden task card (research on demand)
  const ak = A(S, 'ask-card', 44, 370, 1512, 132);
  H.askCard = ak;
  const hd = div('hd', ak); withIcon(hd, 'sparkle'); el('span', '', hd, 'Ask Heyden'); const hs = el('span', '', hd, '— AI research on demand');
  H.askQ = div('qq', ak, ASK_Q);
  H.askStatus = A(ak, 'hy-meta', 22, 90, null, null, 'Researching the Commons…'); H.askStatus.style.color = '#9CC6E0';
  H.askBar = A(ak, 'research-bar', 22, 118, 1468, 4); H.askBarI = el('i', '', H.askBar);
  H.askDone = A(ak, 'row', 22, 86, 1200, 30); H.askDone.style.gap = '8px';
  const dl = el('span', 'hy-meta', H.askDone, 'Curated view'); dl.style.color = '#CFE4F2'; dl.style.fontWeight = 600;
  tag(H.askDone, 'research', 'Early Warning & Detection');
  ['Australia', 'United States', 'Canada'].forEach((r) => tag(H.askDone, 'mute', r));
  // results grid
  const GW = (1512 - 2 * 18) / 3;
  H.cards = LISTINGS.map(([cls, lab, name, cap, region, icon, tone], i) => {
    const col = i % 3, row = Math.floor(i / 3);
    const c = A(S, 'hy-card cm-card', 44 + col * (GW + 18), 522 + row * 176, GW, 158);
    const lg = div('lg', c);
    const T = { t: ['rgba(54,130,127,.16)', 'rgba(114,168,165,.42)', '#8CC2BE'], v: ['rgba(255,255,255,.06)', 'rgba(255,255,255,.2)', '#E5E5E2'], b: ['rgba(66,129,164,.16)', 'rgba(111,163,194,.42)', '#8EC0DF'], o: ['rgba(251,139,36,.12)', 'rgba(251,139,36,.42)', '#FDA04A'] }[tone];
    Object.assign(lg.style, { background: T[0], boxShadow: `inset 0 0 0 1px ${T[1]}`, color: T[2] });
    lg.innerHTML = svg(icon);
    div('nm', c, name);
    const tg = div('tg', c); tag(tg, cls, lab);
    const rg = div('rg', c, region);
    const ds = div('ds', c); const sk1 = el('div', '', ds); sk1.textContent = cap;
    sk1.style.cssText = 'font-size:13px;color:rgba(255,255,255,.72)';
    // what the listing carries (site copy: claimed listings, products with TRL, published problem statements)
    const mr = A(c, 'row', 88, 114); mr.style.gap = '8px';
    tag(mr, 'ok', 'Claimed listing', 'check');
    const extra = { vendor: 'Products with TRL', agency: 'Problem statements', research: 'Capability tags', industry: 'Sector-wide' }[cls];
    tag(mr, 'mute', extra);
    return { c, lg };
  });
  H.count = A(S, 'hy-meta', 44, 880, null, null, 'Showing 1–21 of 219');
  return H;
}
