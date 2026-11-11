/**
 * The showcase's product shot: the real app's ladder screen, with the app's own made-up
 * example deal, at phone size. Writes public/product/app-ladder.webp and its dimensions
 * (src/lib/product-shot.json). Not part of the site build: run it after changing the app's
 * ladder screen, with the app served on APP (default: the app preview on :4173):
 *   npm run build -w apps/app && npm run preview -w apps/app
 *   node apps/site/scripts/product-shot.ts
 * The WebP is encoded by the browser itself (canvas.toDataURL), so no image library is needed.
 */
import { chromium } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const APP = process.env.APP ?? 'http://localhost:4173/';
const site = join(import.meta.dirname, '..');
const LIMIT_KB = 80;

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
  JSON.stringify({ src: '/product/app-ladder.webp', width: w / 2, height: h / 2 }, null, 2) + '\n',
);
console.log(`app-ladder.webp ${(bytes.length / 1024).toFixed(1)} KB, ${w}×${h}`);
