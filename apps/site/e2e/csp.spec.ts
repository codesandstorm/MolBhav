import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test, type Page } from '@playwright/test';
import { headersFor, parseHeaders } from '../../../scripts/pages-serve.ts';

/**
 * Deploy check (docs/product/16_deploy.md): the built site, served with exactly the headers in
 * public/_headers (the file itself, read by scripts/pages-serve.ts, not a copy), loads under
 * its Content-Security-Policy, the 3D scene still starts after the first interaction, and a
 * request to another origin is blocked by that policy.
 */
const BASE = 'http://127.0.0.1:4181';
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
  await context.route(/^https?:\/\/(?!127\.0\.0\.1:4181\/)/, (r) => r.abort());
});

test('the served headers are the ones in public/_headers', async ({ page }) => {
  const res = await page.goto(`${BASE}/`);
  const h = res!.headers();
  for (const [k, v] of Object.entries(headersFor(rules, '/'))) expect(h[k], k).toBe(v);
  expect(h['content-security-policy']).toContain("script-src 'self' 'sha256-");
  expect(h['content-security-policy']).not.toMatch(/unsafe-inline|unsafe-eval/);
  expect(h['cache-control']).toBe('no-cache');
  const html = await (await page.request.get(`${BASE}/`)).text();
  const asset = /src="(\/_astro\/[^"]+\.js)"/.exec(html)![1]!;
  const a = await page.request.get(`${BASE}${asset}`);
  expect(a.headers()['cache-control']).toBe('public, max-age=31536000, immutable');
});

test('the page and the 3D scene after the first interaction work under the CSP', async ({
  page,
}) => {
  const violations = await watchCsp(page);
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(`${BASE}/`);
  await page.waitForLoadState('networkidle');
  await expect(page.locator('[data-stage] .poster')).toBeVisible();
  await page.mouse.wheel(0, 30);
  await page.locator('[data-stage][data-hero="live"]').waitFor({ timeout: 30_000 });
  await page.waitForTimeout(500);
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
