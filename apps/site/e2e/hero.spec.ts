import { expect, test, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { heroLadder } from '../src/lib/example.ts';
import { disableWebGL, recordTransfers, unlabelledNumbers } from './helpers.ts';

const ladder = heroLadder();
const SCENE_CHUNK = /LadderScene/;
const sceneRequests = (urls: string[]) => urls.filter((u) => SCENE_CHUNK.test(u));
const value = (id: string) => ladder.rungs.find((r) => r.id === id)?.value ?? '';
const stage = (page: Page) => page.locator('[data-stage]');

test.describe('showcase: text first and true copy', () => {
  test('headline, promise, both calls to action and every number work with JavaScript off', async ({
    browser,
  }) => {
    const ctx = await browser.newContext({ javaScriptEnabled: false });
    const page = await ctx.newPage();
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      'Know your floor before they name their price.',
    );
    await expect(page.locator('h1 em')).toHaveText('before they name their price.');
    await expect(page.locator('.promise')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Try the price ladder' }).first()).toHaveAttribute(
      'href',
      /app/,
    );
    await expect(page.getByRole('link', { name: 'See how it works' })).toHaveAttribute(
      'href',
      '#how',
    );
    for (const r of ladder.rungs) await expect(page.getByText(r.value).first()).toBeVisible();
    await expect(page.locator('.poster')).toBeVisible();
    expect(await unlabelledNumbers(page)).toEqual([]);
    await ctx.close();
  });

  test('every number is an engine output with a visible CALCULATION chip, labelled made up', async ({
    page,
  }) => {
    await page.goto('/');
    expect(await unlabelledNumbers(page)).toEqual([]);
    const card = await page.locator('.example-card [data-label] strong').allTextContents();
    expect(card).toEqual([value('opening'), value('target'), value('floor')]);
    const story = await page.locator('.steps [data-label] strong').allTextContents();
    expect(story).toEqual([value('floor'), value('target'), value('opening')]);
    for (const room of await page.locator('.card-room, .story .room').allTextContents())
      expect(room).toContain(ladder.roomPct);
    await expect(page.locator('.example-card')).toContainText('Example (made up)');
  });

  test('no claim the register forbids, and everything unbuilt says Planned', async ({ page }) => {
    await page.goto('/');
    const text = (await page.locator('body').innerText()).replace(/\s+/g, ' ');
    for (const banned of [
      /backed by evidence/i,
      /market evidence/i,
      /sourced rate/i,
      /market data/i,
      /readiness/i,
      /\d+\s*%\s*ready/i,
      /win (better |your )?negotiations?/i,
      /AI[- ]powered/i,
      /role[- ]play/i,
      /good (morning|afternoon|evening)/i,
      /\b(research|use cases|team)\b/i,
    ])
      expect(text, String(banned)).not.toMatch(banned);
    const pillar = page.locator('.pillar', { hasText: 'Practise before the call' });
    await expect(pillar.locator('.chip-planned')).toHaveText('Planned');
    for (const [step, planned] of [
      ['Prepare', false],
      ['Practise', true],
      ['Debrief', true],
    ] as const)
      await expect(
        page.locator('.how-step', { hasText: step }).locator('.chip-planned'),
      ).toHaveCount(planned ? 1 : 0);
    for (const p of ['Exact numbers', 'Every claim labelled', 'Private on your device'])
      await expect(page.locator('.pillar', { hasText: p }).locator('.chip-planned')).toHaveCount(0);
  });

  test('nav lists only what exists: How it works, Privacy, Try it', async ({ page }) => {
    await page.goto('/');
    const nav = page.getByRole('navigation', { name: 'Main' });
    expect((await nav.getByRole('link').allTextContents()).map((t) => t.trim())).toEqual([
      'How it works',
      'Privacy',
      'Try it',
    ]);
    await expect(page.locator('#how')).toHaveCount(1);
    await expect(page.locator('#privacy')).toHaveCount(1);
  });

  test('the full story is semantic HTML with a text alternative for the scene', async ({
    page,
  }) => {
    await page.goto('/');
    for (const name of ['Floor', 'Target', 'Opening'])
      await expect(
        page.getByRole('heading', { level: 3, name: new RegExp(`^${name}`) }),
      ).toBeVisible();
    await expect(stage(page)).toHaveAttribute('aria-hidden', 'true');
    await expect(page.locator('.stage-alt')).toContainText('slab of stone');
    await expect(page.locator('.stage-alt')).toContainText('bar of warm light');
  });
});

test.describe('showcase: poster first, 3D only after the first interaction', () => {
  test('the poster is the first frame and nothing 3D loads until the visitor acts', async ({
    browser,
  }) => {
    const ctx = await browser.newContext();
    const rec = recordTransfers(ctx);
    const page = await ctx.newPage();
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    await expect(stage(page)).toHaveAttribute('data-hero', 'poster');
    await expect(page.locator('.poster')).toBeVisible();
    expect(await page.locator('.poster').evaluate((e) => getComputedStyle(e).opacity)).toBe('1');
    await expect(page.locator('[data-stage] canvas')).toHaveCount(0);
    expect(sceneRequests(rec.requests.map((r) => r.url()))).toEqual([]);
    const before = await stage(page).boundingBox();

    await page.mouse.wheel(0, 30); // first interaction
    await expect(stage(page)).toHaveAttribute('data-hero', 'live', { timeout: 20_000 });
    expect(sceneRequests(rec.requests.map((r) => r.url())).length).toBeGreaterThan(0);
    await page.evaluate(() => scrollTo(0, 0));
    await page.waitForTimeout(300);
    expect(await stage(page).boundingBox(), 'the stage does not move or resize').toEqual(before);
    await ctx.close();
  });

  test('a key press is a first interaction too', async ({ browser }) => {
    const ctx = await browser.newContext();
    const rec = recordTransfers(ctx);
    const page = await ctx.newPage();
    await page.goto('/');
    await page.waitForTimeout(1500);
    expect(sceneRequests(rec.requests.map((r) => r.url()))).toEqual([]);
    await page.keyboard.press('Tab');
    await expect(stage(page)).toHaveAttribute('data-hero', 'live', { timeout: 20_000 });
    await expect(page.locator('[data-stage] canvas')).toHaveAttribute('aria-hidden', 'true');
    await ctx.close();
  });

  test('without WebGL: the poster stays, the same text shows, no 3D code is downloaded', async ({
    browser,
  }) => {
    const ctx = await browser.newContext();
    await disableWebGL(ctx);
    const rec = recordTransfers(ctx);
    const page = await ctx.newPage();
    await page.goto('/');
    await page.mouse.wheel(0, 2000);
    await page.waitForTimeout(3000);
    await expect(stage(page)).toHaveAttribute('data-hero', 'poster');
    await expect(page.locator('[data-stage] canvas')).toHaveCount(0);
    await expect(page.locator('.poster')).toBeVisible();
    for (const r of ladder.rungs) await expect(page.getByText(r.value).first()).toBeAttached();
    expect(sceneRequests(rec.requests.map((r) => r.url()))).toEqual([]);
    await ctx.close();
  });

  test('a lost WebGL context brings the poster back', async ({ page }) => {
    await page.goto('/');
    await page.mouse.wheel(0, 30);
    await expect(stage(page)).toHaveAttribute('data-hero', 'live', { timeout: 20_000 });
    await page.evaluate(() => {
      const gl = document.querySelector('canvas')?.getContext('webgl2');
      gl?.getExtension('WEBGL_lose_context')?.loseContext();
    });
    await expect(stage(page)).toHaveAttribute('data-hero', 'poster');
    await expect(page.locator('.poster')).toBeVisible();
  });

  test('reduced motion: never downloads 3D, even after scrolling; scroll stays native', async ({
    browser,
  }) => {
    const ctx = await browser.newContext({ reducedMotion: 'reduce' });
    const rec = recordTransfers(ctx);
    const page = await ctx.newPage();
    await page.goto('/');
    await page.mouse.wheel(0, 3000);
    await page.keyboard.press('Tab');
    await page.waitForTimeout(2500);
    expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(1000);
    await expect(stage(page)).toHaveAttribute('data-hero', 'poster');
    await expect(page.locator('[data-stage] canvas')).toHaveCount(0);
    await expect(page.locator('.poster')).toBeVisible();
    const urls = rec.requests.map((r) => r.url());
    expect(urls.filter((u) => SCENE_CHUNK.test(u) || /HeroScene/.test(u))).toEqual([]);
    await ctx.close();
  });
});

test.describe('showcase: keyboard, touch and accessibility', () => {
  test('keyboard walk-through: skip link, nav, calls to action, all with visible focus', async ({
    page,
  }) => {
    await page.goto('/');
    const order: string[] = [];
    for (let i = 0; i < 11; i++) {
      await page.keyboard.press('Tab');
      const info = await page.evaluate(() => {
        const el = document.activeElement as HTMLElement;
        const s = getComputedStyle(el);
        const r = el.getBoundingClientRect();
        return {
          text: (el.innerText || el.getAttribute('aria-label') || '').trim(),
          ring: s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) >= 2,
          onScreen: r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < innerHeight,
          inStage: Boolean(el.closest('[data-stage]')),
        };
      });
      expect(info.ring, `focus ring on ${info.text}`).toBe(true);
      expect(info.onScreen, `${info.text} visible when focused`).toBe(true);
      expect(info.inStage, 'nothing in the decorative stage takes focus').toBe(false);
      order.push(info.text);
    }
    expect(order).toEqual([
      'Skip to content',
      'MolBhav',
      'How it works',
      'Privacy',
      'Try it',
      'Try the price ladder',
      'See how it works',
      'Try the price ladder',
      'How it works',
      'Privacy',
      'Try it',
    ]);
    await page.keyboard.press('Shift+Tab');
    for (let i = 0; i < 9; i++) await page.keyboard.press('Shift+Tab');
    await page.keyboard.press('Enter'); // the skip link
    expect(await page.evaluate(() => document.activeElement?.id)).toBe('main');
  });

  test('360 px wide: no horizontal scroll, touch scrolling is not trapped', async ({ browser }) => {
    const ctx = await browser.newContext({
      viewport: { width: 360, height: 740 },
      hasTouch: true,
      isMobile: true,
    });
    const page = await ctx.newPage();
    await page.goto('/');
    await page.mouse.wheel(0, 900);
    await page.waitForTimeout(2000);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      360,
    );
    const touch = await page.evaluate(() =>
      [...document.querySelectorAll('[data-stage], [data-stage] *')].map(
        (e) => getComputedStyle(e).touchAction,
      ),
    );
    expect(touch.filter((t) => t === 'none')).toEqual([]);
    const small = await page.evaluate(() =>
      [...document.querySelectorAll('a, button')]
        .map((e) => ({
          t: (e as HTMLElement).innerText.trim(),
          h: e.getBoundingClientRect().height,
        }))
        .filter((x) => x.h > 0 && x.h < 44 && x.t !== 'Skip to content'),
    );
    expect(small, 'touch targets are at least 44 px tall').toEqual([]);
    await ctx.close();
  });

  for (const width of [360, 1280])
    test(`axe: no serious or critical violations at ${width} px, poster and live`, async ({
      browser,
    }) => {
      const ctx = await browser.newContext({ viewport: { width, height: 800 } });
      const page = await ctx.newPage();
      await page.goto('/');
      const check = async () => {
        const r = await new AxeBuilder({ page }).analyze();
        return r.violations
          .filter((v) => v.impact === 'serious' || v.impact === 'critical')
          .map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(' ')}`);
      };
      expect(await check()).toEqual([]);
      await page.mouse.wheel(0, 30);
      await expect(stage(page)).toHaveAttribute('data-hero', 'live', { timeout: 20_000 });
      await page.locator('.story .room').scrollIntoViewIfNeeded();
      await page.waitForTimeout(800);
      expect(await check()).toEqual([]);
      await ctx.close();
    });
});

test.describe('privacy', () => {
  test('every request is same-origin and read-only, including the 3D scene', async ({
    browser,
  }) => {
    const ctx = await browser.newContext();
    const rec = recordTransfers(ctx);
    const page = await ctx.newPage();
    await page.goto('/');
    await page.mouse.wheel(0, 30);
    await expect(stage(page)).toHaveAttribute('data-hero', 'live', { timeout: 20_000 });
    await page.mouse.wheel(0, 6000);
    await page.waitForTimeout(1500);
    const origin = new URL(page.url()).origin;
    const foreign = rec.requests
      .map((r) => ({ url: r.url(), method: r.method() }))
      .filter((r) => !r.url.startsWith('data:') && !r.url.startsWith('blob:'))
      .filter((r) => new URL(r.url).origin !== origin || r.method !== 'GET');
    expect(foreign).toEqual([]);
    expect(rec.requests.some((r) => SCENE_CHUNK.test(r.url()))).toBe(true);
    await ctx.close();
  });
});
