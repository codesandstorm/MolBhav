import { expect, test, type Page } from '@playwright/test';

/**
 * S5/S6 layout: at 360, 768 and 1280 px wide, the options and draft screens have no sideways
 * scroll, every control is at least 44 px tall (touch target), and nothing fades (motion is
 * transform-only, 15 §7). Made-up messages, not gold.
 */
const toOptions = async (page: Page) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Read a client’s reply' }).click();
  await page.getByLabel('Paste what your client said').fill('Too high. Can you do 40k?');
  await page.getByRole('button', { name: 'Read it' }).click();
  await page.getByRole('button', { name: 'Use the example deal' }).click();
  await expect(page.getByRole('heading', { name: 'Your options' })).toBeVisible();
};

const layoutProblems = (page: Page) =>
  page.evaluate(() => {
    const bad: string[] = [];
    const doc = document.documentElement;
    if (doc.scrollWidth > doc.clientWidth)
      bad.push(`sideways scroll ${doc.scrollWidth} > ${doc.clientWidth}`);
    const controls = document.querySelectorAll<HTMLElement>(
      'main button, main select, main input:not([type="radio"]), main .choice-option, main textarea, main summary',
    );
    for (const c of controls) {
      const r = c.getBoundingClientRect();
      if (r.width === 0 && r.height === 0) continue; // not shown
      if (r.height < 44)
        bad.push(
          `${c.tagName.toLowerCase()} "${(c.textContent ?? '').trim().slice(0, 30)}" is ${r.height.toFixed(0)} px tall`,
        );
    }
    for (const a of document.getAnimations()) {
      const effect = a.effect as KeyframeEffect | null;
      if ((effect?.getKeyframes() ?? []).some((k) => 'opacity' in k))
        bad.push(`an animation fades ${String((effect?.target as Element | null)?.className)}`);
    }
    return bad;
  });

for (const width of [360, 768, 1280]) {
  test(`options and draft at ${width} px: no sideways scroll, 44 px targets, no fades`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 800 });
    await toOptions(page);
    expect(await layoutProblems(page)).toEqual([]);
    await page.getByLabel('How many days would the smaller job take?').fill('5');
    expect(await layoutProblems(page)).toEqual([]);
    await page.getByRole('button', { name: 'Draft this reply' }).first().click();
    await expect(page.getByRole('heading', { name: 'Draft your reply' })).toBeVisible();
    expect(await layoutProblems(page)).toEqual([]);
    await page.getByLabel('Your draft').fill('Or maybe 42k, by the 15th.');
    expect(await layoutProblems(page)).toEqual([]);
  });

  test(`a trade draft at ${width} px: the return select fits, no sideways scroll`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 800 });
    // a deal with no quote: your price is the opening, so a trade is offered
    await page.goto('/');
    await page.getByRole('button', { name: 'Start my deal' }).click();
    await page.getByLabel('How long will this project take?').fill('7');
    await page.getByLabel('How many days can you bill in a month?').fill('18');
    await page.getByLabel('What do you need to earn in a month?').fill('90000');
    await page.getByLabel('Direct costs for this work').fill('3000');
    await page.getByRole('button', { name: 'Calculate my ladder' }).click();
    await page.getByRole('button', { name: 'Read their reply' }).click();
    await page.getByLabel('Paste what your client said').fill('Budget is tight. Can you do 47k?');
    await page.getByRole('button', { name: 'Read it' }).click();
    await page.getByRole('button', { name: 'See your options for this reply' }).click();
    await page.getByRole('button', { name: 'Draft this reply', disabled: false }).first().click();
    const ask = page.getByLabel('What you ask back');
    await expect(ask).toBeVisible();
    expect(await layoutProblems(page)).toEqual([]);
    for (const c of ['PORTFOLIO', 'REFERRAL', 'MILESTONES']) {
      await ask.selectOption(c);
      expect(await layoutProblems(page)).toEqual([]);
    }
  });
}
