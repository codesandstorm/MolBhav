import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test, type Page } from '@playwright/test';
import { headersFor, parseHeaders } from '../../../scripts/pages-serve.ts';

/**
 * Deploy check (docs/product/16_deploy.md): the built app, served with exactly the headers in
 * public/_headers (the file itself, read by scripts/pages-serve.ts, not a copy), works under
 * its Content-Security-Policy, and a request to another origin is blocked by that policy.
 * The made-up deal and message below are test input, not gold.
 */
const BASE = 'http://127.0.0.1:4180';
const rules = parseHeaders(
  readFileSync(join(import.meta.dirname, '..', 'public', '_headers'), 'utf8'),
);

const watchCsp = async (page: Page) => {
  await page.addInitScript(() => {
    const w = window as unknown as { __csp: string[] };
    w.__csp = [];
    document.addEventListener('securitypolicyviolation', (e) =>
      w.__csp.push(`${e.violatedDirective} ${e.blockedURI}`),
    );
  });
  return () => page.evaluate(() => (window as unknown as { __csp: string[] }).__csp);
};

test.beforeEach(async ({ context }) => {
  // safety net: nothing may leave this machine, even if the policy failed
  await context.route(/^https?:\/\/(?!127\.0\.0\.1:4180\/)/, (r) => r.abort());
});

test('the served headers are the ones in public/_headers', async ({ page }) => {
  const res = await page.goto(`${BASE}/`);
  const h = res!.headers();
  const want = headersFor(rules, '/');
  expect(Object.keys(want).sort()).toEqual([
    'cache-control',
    'content-security-policy',
    'permissions-policy',
    'referrer-policy',
    'x-content-type-options',
  ]);
  for (const [k, v] of Object.entries(want)) expect(h[k], k).toBe(v);
  expect(h['content-security-policy']).not.toMatch(/unsafe-inline|unsafe-eval/);
  expect(h['cache-control']).toBe('no-cache');
  const sw = await page.request.get(`${BASE}/sw.js`);
  expect(sw.headers()['cache-control']).toBe('no-cache');
  const html = await (await page.request.get(`${BASE}/`)).text();
  const asset = /src="(\/assets\/[^"]+\.js)"/.exec(html)![1]!;
  const a = await page.request.get(`${BASE}${asset}`);
  expect(a.headers()['cache-control']).toBe('public, max-age=31536000, immutable');
  // SPA fallback: an unknown path serves the app
  const deep = await page.request.get(`${BASE}/some/deep/link`);
  expect(deep.status()).toBe(200);
  expect(await deep.text()).toContain('<div id="root">');
});

test('setup, ladder, reader and delete-all work under the CSP', async ({ page }) => {
  const violations = await watchCsp(page);
  const workers: string[] = [];
  page.on('worker', (w) => workers.push(w.url()));
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));

  await page.goto(`${BASE}/`);
  await page.getByRole('button', { name: 'Start my deal' }).click();
  await page.getByLabel('How long will this project take?').fill('7');
  await page.getByLabel('How many days can you bill in a month?').fill('18');
  await page.getByLabel('What do you need to earn in a month?').fill('90000');
  await page.getByLabel('Direct costs for this work').fill('3000');
  await page.getByRole('button', { name: 'Calculate my ladder' }).click();
  await expect(page.getByRole('heading', { name: 'Your price ladder' })).toBeVisible();

  await page.getByRole('button', { name: 'MolBhav' }).click();
  await page.getByRole('button', { name: 'Read a client’s reply' }).click();
  await page.getByLabel('Paste what your client said').fill('Can you do it for 28k?');
  await page.getByRole('radio', { name: 'Yes', exact: true }).check();
  await page.getByRole('button', { name: 'Read it' }).click();
  await expect(page.getByRole('heading', { name: 'What the rules read' })).toBeVisible();
  await expect(page.getByLabel('Amount they mention')).toHaveValue('28,000');

  await page.getByRole('button', { name: 'Settings and privacy' }).click();
  await page.getByRole('button', { name: 'Delete everything on this device' }).click();
  await page.getByRole('button', { name: 'Yes, delete everything' }).click();
  await expect(page.getByText('Everything on this device was deleted.')).toBeVisible();

  expect(workers.length, 'the analyser Worker started under worker-src').toBeGreaterThan(0);
  expect(await violations()).toEqual([]);
  expect(errors).toEqual([]);
});

test('a fetch to another origin is blocked by the CSP', async ({ page }) => {
  const violations = await watchCsp(page);
  await page.goto(`${BASE}/`);
  const outcome = await page.evaluate(async () => {
    try {
      await fetch('https://example.com/molbhav-csp-probe', { mode: 'no-cors' });
      return 'sent';
    } catch {
      return 'blocked';
    }
  });
  expect(outcome).toBe('blocked');
  await expect
    .poll(violations)
    .toContainEqual(expect.stringMatching(/^connect-src https:\/\/example\.com/));
});
