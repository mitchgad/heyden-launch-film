// Flat, frontal renders of the platform pages in their settled states (for design review and the storyboard).
import { buildPlatform, navGeometry, QA_TEXT, ASK_Q } from './platform.js';
const stage = document.getElementById('stage');
let P;
function show(page) {
  for (const k in P.pages) P.pages[k].page.style.display = k === page ? '' : 'none';
  const g = navGeometry(P)[page];
  Object.assign(P.navPill.style, { left: (g.x - 186) + 'px', width: g.w + 'px' });
  Object.assign(P.navBar.style, { left: (g.x - 186 + 14) + 'px', width: (g.w - 28) + 'px' });
  for (const k in P.nav) P.nav[k].classList.toggle('on', k === page);
}
function settle(page, o = {}) {
  const pg = P.pages[page];
  P.cursor.style.display = 'none'; P.click.style.display = 'none';
  if (page === 'projects') {
    pg.fill.style.width = (pg.stages[3].cx - pg.stages[0].cx) + 'px';
  }
  if (page === 'qa') {
    pg.typed.textContent = o.typed ?? QA_TEXT; pg.ph.style.display = 'none'; pg.caret.style.display = o.caret ? '' : 'none';
    pg.prog.style.display = 'none';
    pg.brief.style.display = o.brief === false ? 'none' : '';
    pg.empty1.style.display = o.brief === false ? '' : 'none';
    pg.newItem.style.display = o.brief === false ? 'none' : '';
    pg.panels.forEach((p) => p.segs.forEach((s, i) => { s.style.background = i < p.lv ? p.col : ''; }));
    pg.cells.forEach((c, i) => c.classList.toggle('sel', i === 5 || i === 6));
    const { SX, cw } = pg.cellGeo;
    pg.bAss.style.left = (SX + 5 * (cw + 8) + cw / 2 - 42) + 'px';
    pg.bDecl.style.left = (SX + 6 * (cw + 8) + cw / 2 - 42) + 'px';
  }
  if (page === 'strategy') {
    pg.tiles[1].num.textContent = '1%'; pg.tiles[1].s.textContent = '1 of 124 have aligned projects';
    pg.tiles[2].num.textContent = '104';
    pg.tiles[3].s.textContent = '1 unaligned';
    const { x0, x1, maxV } = pg.chart;
    pg.bars.forEach((b) => { const w = (b.v / maxV) * (x1 - x0); b.b.style.width = w + 'px'; b.bv.style.left = (x0 + w + 10) + 'px'; });
    pg.docs.forEach((d, i) => { if (i === 0) { d.f.style.width = (100 / d.c) + '%'; d.ct.textContent = `1 / ${d.c}`; } });
    pg.gaps[0].st.textContent = '1 aligned project'; pg.gaps[0].st.style.color = '#8CC2BE';
    pg.gaps[0].btn.style.display = 'none'; pg.gaps[0].ok.style.opacity = 1;
    pg.pop.style.display = o.pop ? '' : 'none';
    if (o.pop) { pg.pop.style.left = (1556 - 22 - 16 - 330) + 'px'; pg.pop.style.top = (640 + 54 + 70) + 'px'; }
  }
  if (page === 'commons') {
    pg.q.textContent = o.q ?? ASK_Q; pg.qPh.style.display = 'none'; pg.qCaret.style.display = 'none';
    pg.askStatus.style.display = 'none'; pg.askBar.style.display = 'none';
    pg.cards.forEach((cd, i) => {
      const hit = [0, 1, 5].includes(i);
      cd.c.style.opacity = hit ? 1 : 0.45;
      if (hit) cd.c.style.boxShadow = 'inset 0 0 0 1px rgba(255,255,255,.07), inset 0 0 0 1.5px rgba(111,163,194,.55), 0 0 30px rgba(66,129,164,.25)';
    });
  }
}
window.__design = async (page, o = {}) => { show(page); settle(page, o); await new Promise((r) => requestAnimationFrame(() => r())); return true; };
window.__ready = (async () => {
  await document.fonts.load('700 100px Inter');
  await document.fonts.load('400 100px Inter');
  await document.fonts.ready;
  const holder = document.createElement('div');
  holder.style.cssText = 'position:absolute;left:160px;top:40px;';
  stage.appendChild(holder);
  P = buildPlatform(holder);
  window.P = P;
  return true;
})();
