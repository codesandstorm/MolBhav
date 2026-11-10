import { expect, test, type Request } from '@playwright/test';

/**
 * S13 privacy test: no request body (or URL) ever contains entered deal text.
 * Phase A has no network toggles at all, so "every toggle off" is the only state.
 * Requests are captured at the browser-context level, which includes service-worker traffic.
 */
const PROBES = {
  name: 'ZQXPROBE bakery site 7731',
  e: '11.5',
  K: '17.25',
  M: '987654',
  C: '4321',
  Q: '123457',
};
const needles = [
  ...Object.values(PROBES),
  'ZQXPROBE',
  encodeURIComponent(PROBES.name),
  '9,87,654',
  '987,654',
];

test('no request body or URL contains entered deal text', async ({ page, context, baseURL }) => {
  const seen: Request[] = [];
  context.on('request', (r) => seen.push(r));

  await page.goto('/');
  await page.getByRole('button', { name: 'Start my deal' }).click();
  await page.getByLabel('Deal name (optional)').fill(PROBES.name);
  await page.getByLabel('How long will this project take?').fill(PROBES.e);
  await page.getByLabel('How many days can you bill in a month?').fill(PROBES.K);
  await page.getByLabel('What do you need to earn in a month?').fill(PROBES.M);
  await page.getByLabel('Direct costs for this work').fill(PROBES.C);
  await page.getByRole('button', { name: 'Add more detail' }).click();
  await page.getByLabel('What did you quote? (optional)').fill(PROBES.Q);
  await page.getByRole('button', { name: 'Calculate my ladder' }).click();
  await expect(page.getByRole('heading', { name: 'Your price ladder' })).toBeVisible();
  await page.getByText('How we got this').click();
  await page.getByRole('button', { name: 'Evidence log' }).click();
  await expect(page.getByRole('heading', { name: 'Evidence log' })).toBeVisible();

  // persistence round trip, then delete everything
  await page.reload();
  await page.getByRole('button', { name: PROBES.name }).click();
  await expect(page.getByRole('heading', { name: 'Your price ladder' })).toBeVisible();
  await page.getByRole('button', { name: 'Settings and privacy' }).click();
  await page.getByRole('button', { name: 'Delete everything on this device' }).click();
  await page.getByRole('button', { name: 'Yes, delete everything' }).click();
  await expect(page.getByText('Everything on this device was deleted.')).toBeVisible();
  await page.waitForLoadState('networkidle');

  expect(seen.length).toBeGreaterThan(0); // the capture works
  const origin = new URL(baseURL!).origin;
  for (const r of seen) {
    expect(r.method(), r.url()).toBe('GET');
    expect(new URL(r.url()).origin, r.url()).toBe(origin);
    const body = r.postData() ?? '';
    for (const n of needles) {
      expect(body.includes(n), `body of ${r.url()} contains ${n}`).toBe(false);
      expect(decodeURIComponent(r.url()).includes(n), `URL ${r.url()} contains ${n}`).toBe(false);
    }
  }
});

test('delete everything removes the stored deal', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Try an example deal' }).click();
  await expect(page.getByRole('heading', { name: 'Your price ladder' })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('button', { name: 'Example deal (made up)' })).toBeVisible();
  await page.getByRole('button', { name: 'Settings and privacy' }).click();
  await page.getByRole('button', { name: 'Delete everything on this device' }).click();
  await page.getByRole('button', { name: 'Yes, delete everything' }).click();
  await expect(page.getByText('Everything on this device was deleted.')).toBeVisible();
  const dbs = await page.evaluate(async () => (await indexedDB.databases()).map((d) => d.name));
  expect(dbs).not.toContain('molbhav');
  await page.reload();
  await expect(page.getByRole('button', { name: 'Example deal (made up)' })).toHaveCount(0);
});
