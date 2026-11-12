import { expect, test, type Page, type Request } from '@playwright/test';

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

/**
 * S4b / D10a / claim C3: the pasted client message is read in a Web Worker on the device and
 * never appears in any request (body or URL). A made-up probe message, not gold.
 */
const MESSAGE = 'ZQXREADER bhai 47,613 bahut zyada hai, 38k mein karo? Call 9811122233';
const messageNeedles = [
  MESSAGE,
  'ZQXREADER',
  encodeURIComponent(MESSAGE),
  encodeURIComponent('ZQXREADER'),
  '47,613',
  '47613',
  '9811122233',
  'bahut zyada',
];

test('the pasted client message never leaves the device; it is read in a Worker', async ({
  page,
  context,
  baseURL,
}) => {
  const seen: Request[] = [];
  context.on('request', (r) => seen.push(r));
  const workers: string[] = [];
  page.on('worker', (w) => workers.push(w.url()));

  await page.goto('/');
  await page.getByRole('button', { name: 'Read a client’s reply' }).click();
  await expect(page.getByText('Stays on this device.')).toBeVisible();
  await page.getByLabel('Paste what your client said').fill(MESSAGE);
  await page.getByRole('radio', { name: 'Yes' }).check();
  await page.getByRole('button', { name: 'Read it' }).click();
  await expect(page.getByRole('heading', { name: 'What the rules read' })).toBeVisible();
  await expect(page.locator('[data-reader="move"] .reader-value').first()).toContainText(
    'read by rules on your device; may be wrong',
  );
  await expect(page.getByLabel('Amount they mention')).toHaveValue('38,000');
  await page.getByText('Why: the words it matched').click();
  await page.getByRole('radio', { name: 'Pushes back on the price' }).check();
  await page.getByLabel('Amount they mention').fill('40000');

  // delete everything clears this screen too
  await page.getByRole('button', { name: 'Settings and privacy' }).click();
  await page.getByRole('button', { name: 'Delete everything on this device' }).click();
  await page.getByRole('button', { name: 'Yes, delete everything' }).click();
  await expect(page.getByText('Everything on this device was deleted.')).toBeVisible();
  await page.getByRole('button', { name: 'MolBhav' }).click();
  await page.getByRole('button', { name: 'Read a client’s reply' }).click();
  await expect(page.getByLabel('Paste what your client said')).toHaveValue('');
  await page.waitForLoadState('networkidle');

  expect(workers.length, 'the analyser ran in a Web Worker').toBeGreaterThan(0);
  expect(seen.length).toBeGreaterThan(0); // the capture works
  const origin = new URL(baseURL!).origin;
  for (const r of seen) {
    expect(r.method(), r.url()).toBe('GET');
    expect(new URL(r.url()).origin, r.url()).toBe(origin);
    const body = r.postData() ?? '';
    const url = decodeURIComponent(r.url());
    for (const n of messageNeedles) {
      expect(body.includes(n), `body of ${r.url()} contains ${n}`).toBe(false);
      expect(url.includes(n), `URL ${r.url()} contains ${n}`).toBe(false);
    }
    const headers = JSON.stringify(await r.allHeaders());
    expect(headers.includes('ZQXREADER'), `headers of ${r.url()}`).toBe(false);
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

/** every stored deal, as JSON (bigints written as "123n") */
const storedDeals = (page: Page) =>
  page.evaluate(
    () =>
      new Promise<string>((resolve) => {
        const open = indexedDB.open('molbhav');
        open.onsuccess = () => {
          const all = open.result.transaction('deals').objectStore('deals').getAll();
          all.onsuccess = () => {
            const json = JSON.stringify(all.result, (_, v) =>
              typeof v === 'bigint' ? `${v}n` : v,
            );
            open.result.close(); // an open connection would block "delete everything"
            resolve(json);
          };
        };
      }),
  );

/**
 * S5/S6: options and drafts are worked out on the device. Neither the client's message nor the
 * draft the user writes appears in any request, and the stored deal holds the draft but never
 * the client's message. Made-up probes, not gold.
 */
test('options and drafts never leave the device; the client message is never stored', async ({
  page,
  context,
  baseURL,
}) => {
  const seen: Request[] = [];
  context.on('request', (r) => seen.push(r));
  const DRAFT = 'ZQXDRAFT my price stays at ₹45,000';
  const needles = ['ZQXREADER', 'ZQXDRAFT', '47,613', '47613', '9811122233', 'bahut zyada'];

  await page.goto('/');
  await page.getByRole('button', { name: 'Read a client’s reply' }).click();
  await page.getByLabel('Paste what your client said').fill(MESSAGE);
  await page.getByRole('button', { name: 'Read it' }).click();
  await page.getByRole('button', { name: 'Use the example deal' }).click();
  await expect(page.getByRole('heading', { name: 'Your options' })).toBeVisible();
  // the first enabled one: a scope card's button waits for the smaller effort
  await page.getByRole('button', { name: 'Draft this reply', disabled: false }).first().click();
  await expect(page.getByRole('heading', { name: 'Draft your reply' })).toBeVisible();
  await expect(
    page.getByText('Nothing is sent anywhere; you send it yourself.').first(),
  ).toBeVisible();
  await page.getByLabel('Your draft').fill(DRAFT);
  await page.getByRole('radio', { name: 'Firm' }).check({ force: true });
  await page.getByRole('button', { name: 'Copy the draft' }).click();

  // what is stored: the draft, with the deal; never the client's message
  await expect.poll(() => storedDeals(page)).toContain('ZQXDRAFT');
  const stored = await storedDeals(page);
  for (const n of ['ZQXREADER', 'bahut zyada', '9811122233', '47,613', '47613'])
    expect(stored.includes(n), `storage contains ${n}`).toBe(false);

  // delete everything clears the draft too
  await page.getByRole('button', { name: 'Settings and privacy' }).click();
  await page.getByRole('button', { name: 'Delete everything on this device' }).click();
  await page.getByRole('button', { name: 'Yes, delete everything' }).click();
  await expect(page.getByText('Everything on this device was deleted.')).toBeVisible();
  const dbs = await page.evaluate(async () => (await indexedDB.databases()).map((d) => d.name));
  expect(dbs).not.toContain('molbhav');
  await page.waitForLoadState('networkidle');

  expect(seen.length).toBeGreaterThan(0);
  const origin = new URL(baseURL!).origin;
  for (const r of seen) {
    expect(r.method(), r.url()).toBe('GET');
    expect(new URL(r.url()).origin, r.url()).toBe(origin);
    const body = r.postData() ?? '';
    const url = decodeURIComponent(r.url());
    for (const n of needles) {
      expect(body.includes(n), `body of ${r.url()} contains ${n}`).toBe(false);
      expect(url.includes(n), `URL ${r.url()} contains ${n}`).toBe(false);
    }
  }
});
