/**
 * The showcase's product shot: the real app's ladder screen, with the app's own made-up
 * example deal, at phone size. Writes public/product/app-ladder.webp and its manifest
 * (src/lib/product-shot.json: size, source screen and a hash of that screen's source files).
 * Not part of the site build. Re-run it whenever the app's ladder screen changes:
 *   npm run shots:product
 * That builds the app, serves it on a free local port (4174), takes the shot and stops the
 * server. Set APP=http://… to shoot an app that is already being served instead.
 * The WebP is encoded by the browser itself (canvas.toDataURL), so no image library is needed.
 */
import { chromium } from '@playwright/test';
import { spawn, type ChildProcess } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { SHOT_SCREEN, shotSourceHash } from './shot-source.ts';

const site = join(import.meta.dirname, '..');
const LIMIT_KB = 80;
const PORT = 4174;

let server: ChildProcess | null = null;
let APP = process.env.APP;
if (!APP) {
  // vite preview of the built app (npm run shots:product builds it first)
  server = spawn(`npx vite preview --port ${PORT} --strictPort`, {
    cwd: join(site, '..', 'app'),
    shell: true,
    stdio: 'ignore',
  });
  APP = `http://localhost:${PORT}/`;
  const until = Date.now() + 30_000;
  for (;;) {
    try {
      if ((await fetch(APP)).ok) break;
    } catch {
      /* not up yet */
    }
    if (Date.now() > until) throw new Error(`the app preview did not start on ${APP}`);
    await new Promise((r) => setTimeout(r, 250));
  }
}
const stop = () => {
  if (!server?.pid) return;
  // the preview runs under a shell: stop the whole process tree
  if (process.platform === 'win32') spawn('taskkill', ['/pid', String(server.pid), '/T', '/F']);
  else server.kill('SIGTERM');
};

try {
  const browser = await chromium.launch(process.env.CI ? {} : { channel: 'msedge' });
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 760 },
    deviceScaleFactor: 2,
    reducedMotion: 'reduce',
  });
  const page = await ctx.newPage();
  await page.goto(APP);
  await page.getByRole('button', { name: 'Try an example deal' }).click();
  await page.getByRole('heading', { name: 'Your price ladder' }).waitFor();
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
  await page.mouse.move(0, 0);
  const png = await page.screenshot({ type: 'png' });

  // encode in the page: PNG → canvas → WebP
  const enc = await ctx.newPage();
  const { data, w, h } = await enc.evaluate(async (b64) => {
    const img = new Image();
    img.src = `data:image/png;base64,${b64}`;
    await img.decode();
    const c = document.createElement('canvas');
    c.width = img.naturalWidth;
    c.height = img.naturalHeight;
    c.getContext('2d')!.drawImage(img, 0, 0);
    return { data: c.toDataURL('image/webp', 0.78), w: c.width, h: c.height };
  }, png.toString('base64'));
  await browser.close();

  if (!data.startsWith('data:image/webp')) throw new Error('this browser cannot encode WebP');
  const bytes = Buffer.from(data.split(',')[1]!, 'base64');
  if (bytes.length / 1024 > LIMIT_KB)
    throw new Error(`product shot is ${(bytes.length / 1024).toFixed(0)} KB (limit ${LIMIT_KB})`);
  mkdirSync(join(site, 'public', 'product'), { recursive: true });
  writeFileSync(join(site, 'public', 'product', 'app-ladder.webp'), bytes);
  writeFileSync(
    join(site, 'src', 'lib', 'product-shot.json'),
    JSON.stringify(
      {
        src: '/product/app-ladder.webp',
        width: w / 2,
        height: h / 2,
        screen: SHOT_SCREEN,
        sourceSha256: shotSourceHash(),
      },
      null,
      2,
    ) + '\n',
  );
  console.log(`app-ladder.webp ${(bytes.length / 1024).toFixed(1)} KB, ${w}×${h}`);
} finally {
  stop();
}
