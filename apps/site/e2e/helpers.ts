import type { BrowserContext, Page, Request } from '@playwright/test';

/** Makes WebGL unavailable, as on a device or browser without it. */
export const disableWebGL = async (ctx: BrowserContext) =>
  ctx.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (
      this: HTMLCanvasElement,
      type: string,
      ...rest: unknown[]
    ) {
      if (/webgl/i.test(type)) return null;
      return (original as (...a: unknown[]) => unknown).call(this, type, ...rest);
    } as typeof original;
  });

export interface Transfer {
  url: string;
  method: string;
  type: string;
  bytes: number;
}

/** Records every request of a context with its compressed (on-the-wire) size. */
export const recordTransfers = (ctx: BrowserContext) => {
  const done: Promise<Transfer>[] = [];
  const all: Request[] = [];
  ctx.on('request', (r) => all.push(r));
  ctx.on('requestfinished', (r) =>
    done.push(
      r.sizes().then((s) => ({
        url: r.url(),
        method: r.method(),
        type: r.resourceType(),
        bytes: s.responseBodySize + s.responseHeadersSize,
      })),
    ),
  );
  return { requests: all, transfers: () => Promise.all(done) };
};

export const sum = (t: Transfer[]) => t.reduce((n, x) => n + x.bytes, 0);
export const kb = (n: number) => `${(n / 1024).toFixed(1)} KB`;

/** In-page check, the same rule as the app's S7 test: digits and ₹ only inside a labelled claim. */
export const unlabelledNumbers = (page: Page) =>
  page.evaluate(() => {
    const LABELS = new Set(['FACT', 'CALCULATION', 'ESTIMATE', 'USER DECISION', 'RECOMMENDATION']);
    const bad: string[] = [];
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      const text = n.textContent ?? '';
      const el = n.parentElement;
      if (!el || el.closest('script,style,svg')) continue;
      if (/[\d₹]/.test(text) && !el.closest('[data-label]')) bad.push(text.trim());
    }
    for (const el of document.querySelectorAll('*'))
      for (const a of ['aria-label', 'title', 'alt', 'placeholder'])
        if (/[\d₹]/.test(el.getAttribute(a) ?? '')) bad.push(`[${a}] ${el.getAttribute(a)}`);
    for (const el of document.querySelectorAll<HTMLElement>('[data-label]')) {
      const label = el.dataset.label ?? '';
      const chip = el.querySelector(':scope > .chip');
      if (!LABELS.has(label) || chip?.textContent !== label || !chip.checkVisibility())
        bad.push(`missing visible ${label} chip: ${el.textContent}`);
    }
    return bad;
  });
