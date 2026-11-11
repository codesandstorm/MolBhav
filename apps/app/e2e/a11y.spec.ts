import { expect, test, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

/**
 * Wait until no CSS animation or transition is running or pending, then two frames, so axe
 * never reads a half-faded or half-moved frame (the CI color-contrast failure came from a
 * rung caught mid-fade). Times out (fails) rather than skipping if something never settles.
 */
const settled = async (page: Page) => {
  await expect
    .poll(
      () =>
        page.evaluate(async () => {
          await document.fonts.ready;
          return document.getAnimations().filter((a) => a.pending || a.playState === 'running')
            .length;
        }),
      { timeout: 5_000 },
    )
    .toBe(0);
  await page.evaluate(
    () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => r(null)))),
  );
};

const serious = async (page: Page) => {
  await settled(page);
  const r = await new AxeBuilder({ page }).withTags(TAGS).analyze();
  return r.violations
    .filter((v) => v.impact === 'serious' || v.impact === 'critical')
    .map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`);
};

/**
 * axe in every pointer and focus state of the current screen: pointer parked at (0, 0); the
 * pointer over each rung and each button (hover); keyboard focus on each focusable element,
 * reached with Tab so :focus-visible applies. Returns every serious/critical violation with
 * the state it appeared in. Hover and focus never click, so the screen does not change.
 */
const seriousInEveryState = async (page: Page) => {
  const out: string[] = [];
  const note = (state: string, v: string[]) => out.push(...v.map((x) => `[${state}] ${x}`));

  await page.mouse.move(0, 0);
  note('pointer parked at 0,0', await serious(page));

  const hoverables = page.locator('.rung, button');
  const n = await hoverables.count();
  let hovered = 0;
  for (let i = 0; i < n; i++) {
    const el = hoverables.nth(i);
    if (!(await el.isVisible())) continue;
    const name = await el.evaluate(
      (e) =>
        `${e.tagName.toLowerCase()}.${e.className} "${(e.textContent ?? '').trim().slice(0, 24)}"`,
    );
    await el.hover();
    hovered++;
    note(`hover ${name}`, await serious(page));
  }
  expect(hovered, 'the pointer visited at least one element').toBeGreaterThan(0);
  await page.mouse.move(0, 0);

  // keyboard focus on every focusable element, in tab order, until focus wraps
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
  const seen = new Set<string>();
  for (let i = 0; i < 80; i++) {
    await page.keyboard.press('Tab');
    const key = await page.evaluate(() => {
      const e = document.activeElement;
      if (!e || e === document.body) return '';
      const all = [...document.querySelectorAll('*')];
      return `${e.tagName.toLowerCase()}#${all.indexOf(e)} "${(e.textContent ?? (e as HTMLInputElement).value ?? '').trim().slice(0, 24)}"`;
    });
    if (key === '' || seen.has(key)) break;
    seen.add(key);
    note(`focus ${key}`, await serious(page));
  }
  expect(seen.size, 'Tab reached at least one element').toBeGreaterThan(0);
  return out;
};

/** Press Tab until the focused element has the given accessible label/text (max 40 presses). */
const tabTo = async (page: Page, name: string) => {
  for (let i = 0; i < 40; i++) {
    await page.keyboard.press('Tab');
    const label = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement | null;
      if (!el) return '';
      const id = el.getAttribute('id');
      const viaFor = id
        ? document.querySelector(`label[for="${CSS.escape(id)}"]`)?.textContent
        : null;
      // a radio sits inside its label
      const wrapping = el.closest('label')?.textContent;
      return (viaFor ?? wrapping ?? el.textContent ?? '').trim();
    });
    if (label === name) return;
  }
  throw new Error(`could not reach "${name}" with Tab`);
};

test('keyboard only: welcome → setup → ladder, with visible focus', async ({ page }) => {
  await page.goto('/');
  await tabTo(page, 'Start my deal');
  const outline = await page.evaluate(() => {
    const s = getComputedStyle(document.activeElement as Element);
    return { style: s.outlineStyle, width: s.outlineWidth };
  });
  expect(outline.style).not.toBe('none');
  expect(parseFloat(outline.width)).toBeGreaterThanOrEqual(2);
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { name: 'Your deal' })).toBeVisible();

  await tabTo(page, 'How long will this project take?');
  await page.keyboard.type('7');
  await tabTo(page, 'How many days can you bill in a month?');
  await page.keyboard.type('18');
  await tabTo(page, 'What do you need to earn in a month?');
  await page.keyboard.type('90000');
  await tabTo(page, 'Direct costs for this work');
  await page.keyboard.type('3000');
  await tabTo(page, 'Calculate my ladder');
  await page.keyboard.press('Enter');

  const h = page.getByRole('heading', { name: 'Your price ladder' });
  await expect(h).toBeVisible();
  await expect(h).toBeFocused();
  const ladder = page.getByRole('list', { name: 'Your price ladder' });
  await expect(ladder.getByText('₹38,000', { exact: true })).toBeVisible();
});

test('keyboard only: the reader (S4b), from paste to a manual pick', async ({ page }) => {
  await page.goto('/');
  await tabTo(page, 'Read a client’s reply');
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { name: 'Read your client’s reply' })).toBeFocused();
  await tabTo(page, 'Paste what your client said');
  await page.keyboard.type('Can you do it for 28k?'); // made-up, not gold
  await tabTo(page, 'Read it');
  await page.keyboard.press('Enter');
  const result = page.getByRole('heading', { name: 'What the rules read' });
  await expect(result).toBeFocused();
  // the manual picker is reachable and usable from the keyboard
  await tabTo(page, 'Names a price or asks for one');
  await page.keyboard.press('ArrowDown');
  await expect(page.locator('[data-reader="move"] [data-label="USER DECISION"]')).toBeVisible();
});

test('axe: no serious or critical violations on every Phase A screen', async ({ page }) => {
  test.setTimeout(180_000); // one axe run per hover and focus state: about 30 s locally
  await page.goto('/');
  expect(await seriousInEveryState(page)).toEqual([]);

  await page.getByRole('button', { name: 'Start my deal' }).click();
  await page.getByRole('button', { name: 'Calculate my ladder' }).click(); // shows an error
  await expect(page.getByRole('alert')).toBeVisible();
  expect(await seriousInEveryState(page)).toEqual([]);

  await page.getByRole('button', { name: 'MolBhav' }).click();
  await page.getByRole('button', { name: 'Try an example deal' }).click();
  // checked with the pointer still resting where the button was, as in the CI failure
  expect(await serious(page)).toEqual([]);
  await page.getByText('How we got this').click();
  expect(await serious(page)).toEqual([]);
  expect(await seriousInEveryState(page)).toEqual([]);

  await page.getByRole('button', { name: 'Evidence log' }).click();
  expect(await seriousInEveryState(page)).toEqual([]);

  await page.getByRole('button', { name: 'Settings and privacy' }).click();
  await page.getByRole('button', { name: 'Delete everything on this device' }).click();
  expect(await seriousInEveryState(page)).toEqual([]);
});

test('axe: the reader (S4b) in each of its states', async ({ page }) => {
  test.setTimeout(180_000);
  await page.goto('/');
  await page.getByRole('button', { name: 'Read a client’s reply' }).click();
  expect(await seriousInEveryState(page)).toEqual([]);
  await page.getByRole('button', { name: 'Read it' }).click(); // empty-box error
  await expect(page.getByRole('alert')).toBeVisible();
  expect(await serious(page)).toEqual([]);
  // made-up messages, not gold: a confident read with a range, low confidence, no amount
  for (const text of ['Budget 40-45k hai, too high', 'Fine, we will pay 40k.', 'asdf qwer']) {
    await page.getByLabel('Paste what your client said').fill(text);
    await page.getByRole('button', { name: 'Read it' }).click();
    await expect(page.getByRole('heading', { name: 'What the rules read' })).toBeVisible();
    const why = page.getByText('Why: the words it matched');
    if ((await why.count()) > 0) await why.click(); // no evidence → no list
    expect(await serious(page)).toEqual([]);
  }
  // the last state (no move found, the picker open) in every pointer and focus state
  expect(await seriousInEveryState(page)).toEqual([]);
});
