/**
 * Performance budget check (docs/product/08_experience_and_brand.md §8.3; values in budgets.ts).
 * Headless Chromium with network and CPU throttling is a lab proxy for a mid/low-end Android
 * phone [GAP: not a real low-end Android phone]. `npm run test:budget` clears .budget/ and repeats
 * every test five times. Playwright gives each repeat its own worker, so every measurement is
 * appended to .budget/runs.jsonl and each worker rebuilds .budget/report.json from all of it:
 * after the last repeat, each row gives min / median / max over every run.
 */
import { expect, test, type Browser, type Page } from '@playwright/test';
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { budgets, mobileProfile } from '../budgets.ts';
import { disableWebGL, kb, recordTransfers, sum, type Transfer } from './helpers.ts';

type Unit = 'bytes' | 'ms' | '';
const dir = join(import.meta.dirname, '..', '.budget');
const log = join(dir, 'runs.jsonl');
interface Line {
  name: string;
  value: number;
  budget: number | null;
  unit: Unit;
}
const append = (line: Line) => {
  mkdirSync(dir, { recursive: true });
  appendFileSync(log, JSON.stringify(line) + '\n');
};
const fmt = (n: number, unit: Unit) =>
  unit === 'bytes' ? kb(n) : unit === 'ms' ? `${Math.round(n)} ms` : n.toFixed(3);

/** A budgeted row: fails (softly) when this run is over budget. */
const record = (name: string, measured: number, budget: number, unit: Unit) => {
  append({ name, value: measured, budget, unit });
  expect
    .soft(measured, `${name}: ${fmt(measured, unit)} (budget ${fmt(budget, unit)})`)
    .toBeLessThanOrEqual(budget);
};
/** A reported row with no budget yet (a proposal, or attribution). */
const note = (name: string, measured: number, unit: Unit) => {
  append({ name, value: measured, budget: null, unit });
};

test.afterAll(() => {
  if (!existsSync(log)) return;
  const runs = new Map<string, { values: number[]; budget: number | null; unit: Unit }>();
  for (const text of readFileSync(log, 'utf8').split('\n')) {
    if (!text) continue;
    const { name, value, budget, unit } = JSON.parse(text) as Line;
    const row = runs.get(name) ?? { values: [], budget, unit };
    row.values.push(value);
    runs.set(name, row);
  }
  const report: Record<string, Record<string, string | number | boolean>> = {};
  for (const [name, { values, budget, unit }] of runs) {
    const s = [...values].sort((a, b) => a - b);
    const median =
      s.length % 2 ? s[(s.length - 1) / 2]! : (s[s.length / 2 - 1]! + s[s.length / 2]!) / 2;
    report[name] = {
      runs: s.length,
      min: fmt(s[0]!, unit),
      median: fmt(median, unit),
      max: fmt(s.at(-1)!, unit),
      budget: budget === null ? '(none)' : fmt(budget, unit),
      pass: budget === null ? true : s.at(-1)! <= budget,
    };
  }
  writeFileSync(join(dir, 'report.json'), JSON.stringify(report, null, 2) + '\n');
  console.table(report);
});

const settle = async (page: Page) => {
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2500);
};

test('bytes on the wire: nothing 3D before the first interaction', async ({ browser }) => {
  // A WebGL-capable visitor who has not interacted yet.
  const idle = await browser.newContext({ viewport: mobileProfile.viewport });
  const i = recordTransfers(idle);
  const page1 = await idle.newPage();
  await page1.goto('/');
  await settle(page1);
  const before = await i.transfers();
  expect(before.filter((t) => /LadderScene/.test(t.url))).toEqual([]);
  // Then the first scroll: what it adds is the 3D scene.
  await page1.mouse.wheel(0, 30);
  await expect(page1.locator('[data-stage]')).toHaveAttribute('data-hero', 'live', {
    timeout: 20_000,
  });
  await settle(page1);
  const after = await i.transfers();
  await idle.close();

  const urls = new Set(before.map((t) => t.url));
  const threeD: Transfer[] = after.filter((t) => !urls.has(t.url));
  const htmlCss = before.filter((t) => t.type === 'document' || t.type === 'stylesheet');

  record('HTML + CSS (gzip)', sum(htmlCss), budgets.htmlAndCss, 'bytes');
  record('Everything before interaction', sum(before), budgets.initialBeforeThreeD, 'bytes');
  record(
    'Hero 3D JS after first scroll (gzip)',
    sum(threeD.filter((t) => t.type === 'script')),
    budgets.heroThreeDJs,
    'bytes',
  );
  record('Hero scene total (code + assets)', sum(threeD), budgets.sceneTotal, 'bytes');
});

interface Perf {
  lcp: number;
  cls: number;
  fcp: number;
  long: [number, number][];
}

const throttled = async (browser: Browser, noWebGL = false) => {
  const ctx = await browser.newContext({
    viewport: mobileProfile.viewport,
    isMobile: true,
    hasTouch: true,
  });
  if (noWebGL) await disableWebGL(ctx);
  await ctx.addInitScript(() => {
    const w = window as unknown as { __perf: Perf };
    w.__perf = { lcp: 0, cls: 0, long: [], fcp: 0 };
    new PerformanceObserver((l) => {
      for (const e of l.getEntries()) w.__perf.lcp = e.startTime;
    }).observe({ type: 'largest-contentful-paint', buffered: true });
    new PerformanceObserver((l) => {
      for (const e of l.getEntries() as (PerformanceEntry & {
        value: number;
        hadRecentInput: boolean;
      })[])
        if (!e.hadRecentInput) w.__perf.cls += e.value;
    }).observe({ type: 'layout-shift', buffered: true });
    new PerformanceObserver((l) => {
      for (const e of l.getEntries()) w.__perf.long.push([e.startTime, e.duration]);
    }).observe({ type: 'longtask', buffered: true });
    new PerformanceObserver((l) => {
      for (const e of l.getEntries())
        if (e.name === 'first-contentful-paint') w.__perf.fcp = e.startTime;
    }).observe({ type: 'paint', buffered: true });
  });
  const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page);
  await cdp.send('Network.enable');
  await cdp.send('Network.emulateNetworkConditions', {
    offline: false,
    latency: mobileProfile.rttMs,
    downloadThroughput: (mobileProfile.downloadKbps * 1024) / 8,
    uploadThroughput: (mobileProfile.uploadKbps * 1024) / 8,
  });
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: mobileProfile.cpuSlowdown });
  return { ctx, page };
};
const perfOf = (page: Page) => page.evaluate(() => (window as unknown as { __perf: Perf }).__perf);
const tbtOf = (long: [number, number][], from: number, to = Infinity) =>
  long.filter(([s]) => s >= from && s < to).reduce((t, [, d]) => t + Math.max(0, d - 50), 0);
const longTotal = (long: [number, number][], from: number, to: number) =>
  long.filter(([s]) => s >= from && s < to).reduce((t, [, d]) => t + d, 0);

test('lab vitals, throttled mobile: before and after the first scroll', async ({ browser }) => {
  const { ctx, page } = await throttled(browser);
  await page.goto('/', { waitUntil: 'load' });
  await page.waitForLoadState('networkidle', { timeout: 60_000 });
  await page.waitForTimeout(4000); // the pre-interaction window: nothing 3D can start here
  const pre = await perfOf(page);
  record('LCP (lab, throttled)', pre.lcp, budgets.lcpMs, 'ms');
  record('CLS before interaction', pre.cls, budgets.cls, '');
  record('TBT before interaction (lab, throttled)', tbtOf(pre.long, pre.fcp), budgets.tbtMs, 'ms');

  // The first scroll starts the 3D download; measure the next 3 s under the same throttling.
  const t0 = await page.evaluate(() => performance.now());
  await page.mouse.wheel(0, 300);
  await page.waitForTimeout(3200);
  const mid = await perfOf(page);
  note(
    'Long-task total in 3 s after first scroll [HYPOTHESIS budget]',
    longTotal(mid.long, t0, t0 + 3000),
    'ms',
  );
  note('(detail) TBT in 3 s after first scroll', tbtOf(mid.long, t0, t0 + 3000), 'ms');
  await expect(page.locator('[data-stage]')).toHaveAttribute('data-hero', 'live', {
    timeout: 30_000,
  });
  const live = await page.evaluate(() => performance.now());
  await page.waitForTimeout(1000);
  const post = await perfOf(page);
  note('(detail) first scroll → scene live', live - t0, 'ms');
  note(
    '(detail) long-task total, first scroll → live + 1 s',
    longTotal(post.long, t0, live + 1000),
    'ms',
  );
  record('CLS including the scene taking over', post.cls, budgets.cls, '');
  await ctx.close();
});
