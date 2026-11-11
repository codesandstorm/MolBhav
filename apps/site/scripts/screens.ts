/**
 * Review screenshots for docs/product/screens/ (not part of CI). Replaces every file there.
 * Needs the app preview on :4173 and the site on :4321:
 *   npm run build -w apps/app && npm run preview -w apps/app
 *   npm run build -w apps/site && npm run preview -w apps/site
 *   node apps/site/scripts/screens.ts
 *   node apps/site/scripts/screens.ts --only app-reader   (only the reader shots; app preview only)
 * JPEG at quality 72; the script fails if any file is 300 KB or more. hero-before-*.jpg (the
 * A2 hero, kept for the before/after pair) are never deleted; hero-after-*.jpg are rewritten.
 */
import { chromium, type Page } from '@playwright/test';
import { mkdirSync, readdirSync, rmSync, statSync } from 'node:fs';
import { join } from 'node:path';

const out = join(import.meta.dirname, '..', '..', '..', 'docs', 'product', 'screens');
mkdirSync(out, { recursive: true });
const only = process.argv.includes('--only')
  ? process.argv[process.argv.indexOf('--only') + 1]
  : undefined;
for (const f of readdirSync(out))
  if (
    /\.(jpe?g|png)$/.test(f) &&
    !f.startsWith('hero-before-') &&
    (only === undefined || f.startsWith(only))
  )
    rmSync(join(out, f));

const widths = [360, 768, 1280] as const;
const heightOf = (w: number) => (w === 360 ? 740 : w === 768 ? 1024 : 800);
const APP = 'http://localhost:4173/';
const SITE = 'http://localhost:4321/';

const browser = await chromium.launch({
  ...(process.env.CI ? {} : { channel: 'msedge' }),
  args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader'],
});
const files: string[] = [];
const shot = async (page: Page, name: string, fullPage = false) => {
  const path = join(out, `${name}.jpg`);
  if (fullPage) await page.evaluate(() => scrollTo(0, 0));
  await page.waitForTimeout(350); // let the ≤ 200 ms entrance motion finish
  await page.screenshot({ path, type: 'jpeg', quality: 72, fullPage });
  const kb = statSync(path).size / 1024;
  if (kb >= 300) throw new Error(`${name} is ${kb.toFixed(0)} KB`);
  files.push(`${name}.jpg ${kb.toFixed(0)} KB`);
};

/** The reader with a made-up client message (not gold): a price, read with a quote sent. */
const readerShot = async (width: number) => {
  const ctx = await browser.newContext({
    viewport: { width, height: heightOf(width) },
    deviceScaleFactor: 1,
  });
  const p = await ctx.newPage();
  await p.goto(APP);
  await p.getByRole('button', { name: 'Read a client’s reply' }).click();
  await p
    .getByLabel('Paste what your client said')
    .fill('Can you do it for 28k? That is what we planned.');
  await p.getByRole('radio', { name: 'Yes', exact: true }).check({ force: true });
  await p.getByRole('button', { name: 'Read it' }).click();
  await p.locator('[data-reader="move"]').waitFor();
  await p.mouse.move(0, 0);
  await shot(p, `app-reader-${width}`, true);
  await ctx.close();
};

for (const width of widths) {
  const viewport = { width, height: heightOf(width) };
  if (only === 'app-reader') {
    await readerShot(width);
    continue;
  }
  await readerShot(width);

  // App: welcome, setup (with a validation error), ladder (example + quote), evidence, settings
  const a = await browser.newContext({ viewport, deviceScaleFactor: 1 });
  const ap = await a.newPage();
  await ap.goto(APP);
  await ap.getByRole('heading', { level: 2 }).waitFor();
  await shot(ap, `app-welcome-${width}`, true);
  await ap.getByRole('button', { name: 'Start my deal' }).click();
  await ap.getByLabel('How many days can you bill in a month?').fill('18');
  await ap.getByRole('button', { name: 'Calculate my ladder' }).click();
  await shot(ap, `app-setup-${width}`, true);
  await ap.getByLabel('How long will this project take?').fill('7');
  await ap.getByLabel('What do you need to earn in a month?').fill('90000');
  await ap.getByLabel('Direct costs for this work').fill('3000');
  await ap.getByRole('button', { name: 'Add more detail' }).click();
  await ap.getByLabel('What did you quote? (optional)').fill('42000');
  await ap.getByRole('button', { name: 'Calculate my ladder' }).click();
  await ap.getByRole('heading', { name: 'Your price ladder' }).waitFor();
  await shot(ap, `app-ladder-${width}`, true);
  await ap.getByRole('button', { name: 'Evidence log' }).click();
  await shot(ap, `app-evidence-${width}`, true);
  await ap.getByRole('button', { name: 'Settings and privacy' }).click();
  await shot(ap, `app-settings-${width}`, true);
  await a.close();

  // Site: poster (first frame), hero after the first scroll, the story, pillars, trust, footer
  const s = await browser.newContext({ viewport, deviceScaleFactor: 1 });
  const sp = await s.newPage();
  await sp.goto(SITE);
  await sp.waitForLoadState('networkidle');
  await shot(sp, `site-hero-poster-${width}`);
  await sp.mouse.wheel(0, 30);
  await sp.locator('[data-stage][data-hero="live"]').waitFor({ timeout: 20_000 });
  await sp.evaluate(() => scrollTo(0, 0));
  await sp.waitForTimeout(1500);
  await shot(sp, `site-hero-live-${width}`);
  await shot(sp, `hero-after-${width}`);
  await sp.locator('.step-opening').evaluate((e) => e.scrollIntoView({ block: 'center' }));
  await sp.waitForTimeout(1800);
  await shot(sp, `site-ladder-story-${width}`);
  for (const [name, sel] of [
    ['site-product', '.product'],
    ['site-pillars', '.why'],
    ['site-how', '#how'],
    ['site-trust', '#privacy'],
  ] as const) {
    await sp.locator(sel).evaluate((e) => e.scrollIntoView({ block: 'start' }));
    await sp.waitForTimeout(900); // the section reveal (480 ms) and the product shot's rise
    await shot(sp, `${name}-${width}`);
  }
  await sp.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
  await sp.waitForTimeout(500);
  await shot(sp, `site-footer-${width}`);
  await s.close();
}

await browser.close();
console.log(files.join('\n'));
