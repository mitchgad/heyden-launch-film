// Frame-accurate renderer for the Heyden launch film.
//
//   node render.mjs stills 0.5,1.25,6        -> PNG stills (no motion blur)
//   node render.mjs sheet 0:30:0.5            -> contact sheet of times start:end:step
//   node render.mjs frames --from 0 --to 30   -> final PNG frames with sub-frame motion blur
//
// The page exposes window.__ready (promise), window.__render(t) (async) and window.__mb(t) (sub-frame count).
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PROJECT = path.resolve(HERE, '..'); // the repo: brand/, film/, storyboard/
const SCRATCH = process.env.SCRATCH || path.join(PROJECT, 'build'); // footage frames, renders and audio (git-ignored)
const FOOTAGE = path.join(SCRATCH, 'footage');
const FPS = 60;
const DURATION = 50;

const args = process.argv.slice(2);
const mode = args[0];
const opt = (name, def) => {
  const i = args.indexOf('--' + name);
  return i >= 0 ? args[i + 1] : def;
};

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json',
  '.ttf': 'font/ttf', '.jpg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml', '.css': 'text/css' };

function serve() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const url = decodeURIComponent(req.url.split('?')[0]);
      const file = url.startsWith('/footage/') ? path.join(FOOTAGE, url.slice(9))
        : url.startsWith('/film/') ? path.join(HERE, url.slice(6))
        : url.startsWith('/brand/') ? path.join(PROJECT, 'brand', url.slice(7))
        : url.startsWith('/storyboard/') ? path.join(PROJECT, 'storyboard', url.slice(12)) : null;
      if (!file) { res.writeHead(404); res.end(); return; }
      fs.readFile(file, (err, data) => {
        if (err) { res.writeHead(404); res.end(); return; }
        res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'max-age=3600' });
        res.end(data);
      });
    });
    server.listen(0, '127.0.0.1', () => resolve(server));
  });
}

async function openPage(browser, port, scale = 1) {
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: scale });
  const init = opt('init', null);
  if (init) await page.addInitScript(init);
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') console.log('[page]', m.text()); });
  page.on('pageerror', (e) => console.log('[pageerror]', e.message));
  await page.goto(`http://127.0.0.1:${port}/film/index.html`);
  await page.evaluate(() => window.__ready);
  const cdp = await page.context().newCDPSession(page);
  return { page, cdp };
}

async function shot(ctx, t, label = false) {
  await ctx.page.evaluate(async ([tt, lb]) => {
    await window.__render(tt);
    let d = document.getElementById('dbg');
    if (lb) {
      if (!d) { d = document.createElement('div'); d.id = 'dbg'; d.style.cssText = 'position:absolute;left:14px;top:12px;z-index:99;font:600 44px Inter;color:#fff;background:rgba(0,0,0,.65);padding:4px 14px;border-radius:8px'; document.body.appendChild(d); }
      d.textContent = tt.toFixed(2);
    } else if (d) d.remove();
  }, [t, label]);
  const r = await ctx.cdp.send('Page.captureScreenshot', { format: 'png', optimizeForSpeed: true });
  return Buffer.from(r.data, 'base64');
}

function ffmpeg(argv) {
  const p = spawn('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...argv], { stdio: ['pipe', 'inherit', 'inherit'] });
  const done = new Promise((res, rej) => p.on('close', (c) => (c === 0 ? res() : rej(new Error('ffmpeg exit ' + c)))));
  return { p, done };
}

const write = (stream, buf) => new Promise((res) => { if (!stream.write(buf)) stream.once('drain', res); else res(); });

async function main() {
  const server = await serve();
  const port = server.address().port;
  // --ss 2 renders every frame at twice the resolution (true 2x rasterisation, 3D layers included); the encoder
  // downsamples it to 1920x1080, which gives cleaner edges and steadier text on tilted and moving planes
  const SS = Number(opt('ss', 1));
  const launch = () => chromium.launch({ headless: true, args: ['--force-color-profile=srgb', '--disable-lcd-text', '--font-render-hinting=none', ...(SS > 1 ? [`--force-device-scale-factor=${SS}`] : [])] });

  if (mode === 'stills') {
    const times = args[1].split(',').map(Number);
    const out = opt('out', path.join(SCRATCH, 'stills'));
    fs.mkdirSync(out, { recursive: true });
    const browser = await launch();
    const ctx = await openPage(browser, port, Number(opt('scale', 1)));
    for (const t of times) {
      const png = await shot(ctx, t);
      const f = path.join(out, `t${t.toFixed(3).padStart(7, '0')}.png`);
      fs.writeFileSync(f, png);
      console.log(f);
    }
    await browser.close();
  } else if (mode === 'sheet') {
    const [a, b, s] = args[1].split(':').map(Number);
    const times = [];
    for (let t = a; t <= b + 1e-9; t += s) times.push(+t.toFixed(4));
    const cols = Number(opt('cols', 6));
    const rows = Math.ceil(times.length / cols);
    const w = Number(opt('w', 480));
    const h = Math.round((w * 9) / 16);
    const out = opt('out', path.join(SCRATCH, `sheet_${a}_${b}.png`));
    const browser = await launch();
    const ctx = await openPage(browser, port, 1);
    const { p, done } = ffmpeg(['-f', 'image2pipe', '-framerate', '1', '-i', '-', '-vf',
      `scale=${w}:${h}:flags=lanczos,tile=${cols}x${rows}:padding=4:color=0x333333`,
      '-frames:v', '1', out]);
    for (const t of times) await write(p.stdin, await shot(ctx, t, true));
    // pad the tile with blanks
    for (let i = times.length; i < cols * rows; i++) await write(p.stdin, await shot(ctx, times[times.length - 1], true));
    p.stdin.end();
    await done;
    await browser.close();
    console.log(out);
  } else if (mode === 'frames') {
    // Final frames with sub-frame motion blur. Each output frame is the mean of 8 slots; a frame that needs
    // n sub-samples (n in 1,2,4,8) captures n images and repeats each 8/n times so tmix always averages 8.
    const from = Math.round(Number(opt('from', 0)) * FPS);
    const to = Math.round(Number(opt('to', DURATION)) * FPS);
    const workers = Number(opt('workers', 6));
    const out = opt('out', path.join(SCRATCH, 'frames'));
    const shutter = Number(opt('shutter', 0.5)); // fraction of frame interval (0.5 = 180 degrees)
    const maxSub = Number(opt('maxsub', 8));
    fs.mkdirSync(out, { recursive: true });
    const total = to - from;
    const per = Math.ceil(total / workers);
    let doneFrames = 0;
    const t0 = Date.now();
    const jobs = [];
    for (let w = 0; w < workers; w++) {
      const a = from + w * per;
      const b = Math.min(to, a + per);
      if (a >= b) continue;
      jobs.push((async () => {
        const browser = await launch();
        const ctx = await openPage(browser, port, 1);
        const SL = 8;
        const { p, done } = ffmpeg(['-f', 'image2pipe', '-framerate', String(FPS * SL), '-i', '-', '-vf',
          `tmix=frames=${SL},select='eq(mod(n\\,${SL})\\,${SL - 1})'`, '-fps_mode', 'passthrough',
          '-start_number', String(a), path.join(out, '%05d.png')]);
        for (let f = a; f < b; f++) {
          const t = f / FPS;
          let n = await ctx.page.evaluate((tt) => window.__mb(tt), t);
          n = Math.min(maxSub, [1, 2, 4, 8].find((k) => k >= n) || 8);
          for (let s = 0; s < n; s++) {
            const ts = n === 1 ? t : t + (((s + 0.5) / n) - 0.5) * shutter / FPS;
            const png = await shot(ctx, Math.max(0, Math.min(DURATION - 1e-4, ts)));
            for (let r = 0; r < SL / n; r++) await write(p.stdin, png);
          }
          doneFrames++;
          if (doneFrames % 60 === 0) {
            const el = (Date.now() - t0) / 1000;
            console.log(`${doneFrames}/${total} frames  ${el.toFixed(0)}s elapsed  eta ${((el / doneFrames) * (total - doneFrames)).toFixed(0)}s`);
          }
        }
        p.stdin.end();
        await done;
        await browser.close();
      })());
    }
    await Promise.all(jobs);
    console.log('done', ((Date.now() - t0) / 1000).toFixed(1) + 's');
  } else if (mode === 'rough') {
    // real-speed cut: each worker streams its frames into an H.264 chunk, then concat + audio
    //   rough preview:  node render.mjs rough --workers 8 --audio <wav> --out <mp4>
    //   final:          node render.mjs rough --final --ss 2 --maxsub 8 --workers 8 --audio <wav> --out <mp4>
    // --final: sub-frame motion blur (up to --maxsub samples over a --shutter of the frame interval, 0.35 = 126 deg)
    // averaged in float, downsampled from the --ss render, then converted to BT.709 4:2:0 with error-diffusion dither
    // (no grain: the dither keeps the dark gradients smooth without softening the UI)
    const workers = Number(opt('workers', 8));
    const outFile = opt('out', path.join(SCRATCH, 'rough.mp4'));
    const audio = opt('audio', null);
    const final = args.includes('--final');
    const shutter = Number(opt('shutter', 0.35)); // the product section; v1's scenes keep v1's 180-degree shutter
    const [V3_A, V3_B] = [7.86, 42.0];
    const maxSub = Number(opt('maxsub', 1));
    const F0 = Math.round(Number(opt('from', 0)) * FPS), F1 = Math.round(Number(opt('to', DURATION)) * FPS); // a range, for tests
    const total = F1 - F0;
    const per = Math.ceil(total / workers);
    const dir = path.join(SCRATCH, 'rough_chunks');
    fs.rmSync(dir, { recursive: true, force: true });
    fs.mkdirSync(dir, { recursive: true });
    const t0 = Date.now();
    let doneFrames = 0;
    const chunks = [];
    await Promise.all(Array.from({ length: workers }, async (_, w) => {
      const a = F0 + w * per, b = Math.min(F1, a + per);
      if (a >= b) return;
      const file = path.join(dir, `c${String(w).padStart(2, '0')}.mp4`);
      chunks[w] = file;
      const browser = await launch();
      const ctx = await openPage(browser, port, 1);
      const SL = maxSub > 1 ? 8 : 1;
      const chain = [];
      if (final) chain.push('format=gbrpf32le');
      if (SS > 1) chain.push('scale=1920:1080:flags=lanczos+accurate_rnd');
      if (SL > 1) chain.push(`tmix=frames=${SL}`, `select='eq(mod(n\\,${SL})\\,${SL - 1})'`, `setpts=N/${FPS}/TB`);
      chain.push(`scale=out_color_matrix=bt709:out_range=tv:flags=accurate_rnd+full_chroma_int${final ? ':sws_dither=ed' : ''}`, 'format=yuv420p');
      const x264 = final ? ['-preset', 'slow', '-crf', '13', '-tune', 'film', '-x264-params', 'aq-mode=3'] : ['-preset', 'fast', '-crf', '14'];
      const { p, done } = ffmpeg(['-f', 'image2pipe', '-framerate', String(FPS * SL), '-i', '-', '-vf', chain.join(','), '-r', String(FPS),
        '-c:v', 'libx264', ...x264, '-profile:v', 'high', '-g', '60', '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-color_range', 'tv', file]);
      for (let f = a; f < b; f++) {
        const t = f / FPS;
        let n = 1;
        if (SL > 1) { n = await ctx.page.evaluate((tt) => window.__mb(tt), t); n = Math.min(maxSub, [1, 2, 4, 8].find((k) => k >= n) || 8); }
        for (let sI = 0; sI < n; sI++) {
          const ts = n === 1 ? t : t + (((sI + 0.5) / n) - 0.5) * (t < V3_A || t >= V3_B ? 0.5 : shutter) / FPS;
          const png = await shot(ctx, Math.max(0, Math.min(DURATION - 1e-4, ts)));
          for (let r = 0; r < SL / n; r++) await write(p.stdin, png);
        }
        if (++doneFrames % 240 === 0) console.log(`${doneFrames}/${total}  ${((Date.now() - t0) / 1000).toFixed(0)}s`);
      }
      p.stdin.end();
      await done;
      await browser.close();
    }));
    const list = path.join(dir, 'list.txt');
    fs.writeFileSync(list, chunks.filter(Boolean).map((c) => `file '${c}'`).join('\n'));
    const args2 = ['-f', 'concat', '-safe', '0', '-i', list];
    if (audio) args2.push('-i', audio, '-map', '0:v', '-map', '1:a', '-c:a', 'aac', '-b:a', '320k', '-ar', '48000');
    args2.push('-c:v', 'copy', '-movflags', '+faststart', '-t', String(total / FPS), outFile);
    const { done } = ffmpeg(args2);
    await done;
    console.log('done', outFile, ((Date.now() - t0) / 1000).toFixed(1) + 's');
  } else if (mode === 'motion') {
    // camera motion + timeline for the sound design -> audio/motion.json
    const browser = await launch();
    const ctx = await openPage(browser, port, 1);
    const data = await ctx.page.evaluate(() => ({ motion: window.__exportMotion(), TL: window.__TL() }));
    fs.writeFileSync(path.join(HERE, 'audio', 'motion.json'), JSON.stringify(data));
    console.log('motion samples', data.motion.t.length);
    await browser.close();
  } else if (mode === 'geo') {
    // UI geometry in window space (for authoring camera shots): node render.mjs geo
    const browser = await launch();
    const ctx = await openPage(browser, port, 1);
    console.log(JSON.stringify(await ctx.page.evaluate(() => window.__geo())));
    await browser.close();
  } else if (mode === 'print') {
    // storyboard document: node render.mjs print  -> storyboard/heyden-v3-storyboard.pdf + pages/*.png
    const out = path.join(PROJECT, 'storyboard');
    const browser = await launch();
    const page = await browser.newPage({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 2 });
    page.on('pageerror', (e) => console.log('[pageerror]', e.message));
    await page.goto(`http://127.0.0.1:${port}/storyboard/storyboard.html`);
    await page.evaluate(async () => { await document.fonts.ready; await Promise.all([...document.images].map((i) => i.decode().catch(() => {}))); });
    await page.pdf({ path: path.join(out, 'heyden-v3-storyboard.pdf'), width: '1600px', height: '900px', printBackground: true, preferCSSPageSize: true });
    const n = await page.evaluate(() => document.querySelectorAll('.pg').length);
    fs.mkdirSync(path.join(out, 'pages'), { recursive: true });
    for (let i = 0; i < n; i++) {
      const el = (await page.$$('.pg'))[i];
      await el.screenshot({ path: path.join(out, 'pages', `page-${String(i + 1).padStart(2, '0')}.png`) });
    }
    console.log('pages', n);
    await browser.close();
  } else if (mode === 'design') {
    // flat renders of the platform pages: node render.mjs design projects,qa,strategy,commons [--scale 2]
    const pages = args[1].split(',');
    const out = opt('out', path.join(SCRATCH, 'design'));
    fs.mkdirSync(out, { recursive: true });
    const browser = await launch();
    const scale = Number(opt('scale', 1));
    const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: scale });
    page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') console.log('[page]', m.text()); });
    page.on('pageerror', (e) => console.log('[pageerror]', e.message));
    await page.goto(`http://127.0.0.1:${port}/film/design.html`);
    await page.evaluate(() => window.__ready);
    for (const spec of pages) {
      const [pg, extra] = spec.split(':');
      const o = extra ? JSON.parse(decodeURIComponent(extra)) : {};
      await page.evaluate(([a, b]) => window.__design(a, b), [pg, o]);
      const f = path.join(out, `${spec.replace(/[^a-z0-9]+/gi, '_')}.png`);
      await page.screenshot({ path: f, clip: { x: 160 - 40, y: 0, width: 1680, height: 1080 } });
      console.log(f);
    }
    await browser.close();
  } else {
    console.log('unknown mode');
  }
  server.close();
}

main().catch((e) => { console.error(e); process.exit(1); });
