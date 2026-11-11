/**
 * Section reveals and the product shot's slow rise, on our own scroll module. Scrolling stays
 * native: this only reads positions and writes a class or one custom property. Nothing is
 * hidden unless this runs and motion is allowed, so without JavaScript, or with reduced
 * motion, every section is simply there.
 */
import { clamp01 } from './choreography.ts';
import { watchProgress } from './scroll-progress.ts';

/** 0 when the element's top reaches the bottom of the viewport, 1 when it is `span` × vh higher. */
export const riseFrom = (top: number, vh: number, span = 0.75) =>
  clamp01((vh - top) / Math.max(vh * span, 1));

export const startReveals = (doc: Document = document) => {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return () => {};
  const root = doc.documentElement;
  root.dataset.motion = 'on';
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries)
        if (e.isIntersecting) {
          e.target.classList.add('is-in');
          io.unobserve(e.target);
        }
    },
    { rootMargin: '0px 0px -12% 0px' },
  );
  const items = [...doc.querySelectorAll('[data-reveal]')];
  for (const el of items) io.observe(el);
  // keyboard users: a focused element's section shows at once
  const onFocus = (e: FocusEvent) =>
    (e.target as Element | null)?.closest('[data-reveal]')?.classList.add('is-in');
  doc.addEventListener('focusin', onFocus);

  const device = doc.querySelector<HTMLElement>('[data-rise]');
  const stop = device
    ? watchProgress(
        () => riseFrom(device.getBoundingClientRect().top, innerHeight),
        (p) => device.style.setProperty('--rise', p.toFixed(3)),
      )
    : () => {};
  return () => {
    io.disconnect();
    doc.removeEventListener('focusin', onFocus);
    stop();
  };
};
