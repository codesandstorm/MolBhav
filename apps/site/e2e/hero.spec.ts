import { expect, test, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { heroLadder } from '../src/lib/example.ts';
import { disableWebGL, recordTransfers, unlabelledNumbers } from './helpers.ts';

const ladder = heroLadder();
const SCENE_CHUNK = /LadderScene/;
const sceneRequests = (urls: string[]) => urls.filter((u) => SCENE_CHUNK.test(u));
const value = (id: string) => ladder.rungs.find((r) => r.id === id)?.value ?? '';
const stage = (page: Page) => page.locator('[data-stage]');
/** The hero island hydrates after load; an interaction before that is not seen by it. */
const hydrated = (page: Page) =>
  page.locator('astro-island:not([ssr])').first().waitFor({ state: 'attached' });

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
    // Tab before the wheel: Tab focuses the skip link at the top, and focusing scrolls it into
    // view, so a Tab after the wheel raced the wheel's scroll (scrollY 0 in 1 of 5 CI-mode runs)
    await page.keyboard.press('Tab');
    await page.mouse.wheel(0, 3000);
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(1000);
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
    for (let i = 0; i < 12; i++) {
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
      'Try the price ladder', // the real app section
      'Try the price ladder', // how it works
      'How it works',
      'Privacy',
      'Try it',
    ]);
    await page.keyboard.press('Shift+Tab');
    for (let i = 0; i < 10; i++) await page.keyboard.press('Shift+Tab');
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
        // Sections fade in when scrolled to; axe scrolls while it measures, which can catch a
        // section mid-fade. Check every section as a visitor sees it once it is on screen.
        await page.evaluate(() =>
          document.querySelectorAll('[data-reveal]').forEach((e) => e.classList.add('is-in')),
        );
        await page.waitForFunction(() =>
          [...document.querySelectorAll('[data-reveal]')].every(
            (e) => getComputedStyle(e).opacity === '1',
          ),
        );
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

test.describe('showcase: atmosphere, product shot, reveals', () => {
  /** Counts WebGL draw calls, so a test can tell whether the scene is still rendering. */
  const countDraws = (page: Page) =>
    page.addInitScript(() => {
      const w = window as unknown as { __draws: number };
      w.__draws = 0;
      for (const proto of [WebGLRenderingContext.prototype, WebGL2RenderingContext.prototype])
        for (const name of ['drawArrays', 'drawElements'] as const) {
          const original = proto[name] as (...a: unknown[]) => void;
          (proto as unknown as Record<string, unknown>)[name] = function (
            this: unknown,
            ...a: unknown[]
          ) {
            w.__draws++;
            return original.apply(this, a);
          };
        }
    });
  const draws = (page: Page) =>
    page.evaluate(() => (window as unknown as { __draws: number }).__draws);

  test('dust motes keep the scene drawing on screen, and drawing stops off screen', async ({
    page,
  }) => {
    await countDraws(page);
    await page.goto('/');
    await hydrated(page);
    await page.keyboard.press('Shift');
    await expect(stage(page)).toHaveAttribute('data-hero', 'live', { timeout: 20_000 });
    const a = await draws(page);
    await page.waitForTimeout(1000);
    expect(await draws(page), 'ambient frames while the stage is visible').toBeGreaterThan(a);
    await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
    await page.waitForTimeout(1500); // the scroll ease settles
    const b = await draws(page);
    await page.waitForTimeout(1000);
    expect(await draws(page), 'no frames once the stage is off screen').toBe(b);
  });

  test('the real app shot: same-origin, lazy, sized, captioned as made-up example data', async ({
    page,
  }) => {
    await page.goto('/');
    const img = page.locator('.device img');
    await expect(img).toHaveAttribute('loading', 'lazy');
    await expect(img).toHaveAttribute('src', /^\/product\/.+\.webp$/);
    expect(Number(await img.getAttribute('width'))).toBeGreaterThan(0);
    expect(Number(await img.getAttribute('height'))).toBeGreaterThan(0);
    await expect(page.locator('.device-wrap figcaption')).toHaveText(
      'The real app (example data, made up)',
    );
    const res = await page.request.get('/product/app-ladder.webp');
    expect(res.headers()['content-type']).toContain('image/webp');
    expect((await res.body()).length, 'product shot under 80 KB').toBeLessThan(80 * 1024);
  });

  test('one icon set: four inline SVGs on a 24 px grid with one stroke weight', async ({
    page,
  }) => {
    await page.goto('/');
    const icons = await page.locator('.pillar svg.icon').evaluateAll((els) =>
      els.map((e) => ({
        box: e.getAttribute('viewBox'),
        stroke: e.getAttribute('stroke-width'),
        hidden: e.getAttribute('aria-hidden'),
      })),
    );
    expect(icons).toHaveLength(4);
    for (const i of icons) expect(i).toEqual({ box: '0 0 24 24', stroke: '1.6', hidden: 'true' });
  });

  test('reveals: a rise only until scrolled to, never a fade, and none under reduced motion', async ({
    browser,
  }) => {
    const moving = await browser.newPage();
    await moving.goto('/');
    // offset before it is scrolled to, but never faded: text keeps full contrast in every frame
    await expect(moving.locator('.why')).not.toHaveCSS('transform', 'none');
    await expect(moving.locator('.why')).toHaveCSS('opacity', '1');
    await moving.locator('.why').scrollIntoViewIfNeeded();
    await expect(moving.locator('.why')).toHaveCSS('transform', 'none');
    await expect(moving.locator('.why')).toHaveCSS('opacity', '1');
    await moving.close();

    const ctx = await browser.newContext({ reducedMotion: 'reduce' });
    const still = await ctx.newPage();
    await still.goto('/');
    for (const sel of ['.product', '.why', '.how', '.trust', '.foot']) {
      await expect(still.locator(sel)).toHaveCSS('opacity', '1');
      await expect(still.locator(sel)).toHaveCSS('transform', 'none');
    }
    await ctx.close();
  });
});
