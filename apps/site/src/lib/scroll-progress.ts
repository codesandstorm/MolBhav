/**
 * Scroll progress without a library (replaces GSAP ScrollTrigger). Scrolling stays native:
 * we only read positions, at most once per animation frame, and never write layout.
 */
const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);

/**
 * 0 when the element's top is at the top of the viewport, 1 when its bottom has risen to
 * `endAt` × viewport height. Pure, so it is unit-tested.
 */
export const progressFrom = (top: number, height: number, viewport: number, endAt = 0.85) => {
  const distance = height - viewport * endAt;
  return distance <= 0 ? 1 : clamp01((0 - top) / distance);
};

/**
 * Piecewise-linear progress through anchors [scrollY, progress], so each beat of the scene
 * lines up with the caption that explains it, whatever the layout. Anchors are made
 * monotonic first; before the first anchor the result is its progress, after the last, its.
 */
export const piecewise = (y: number, anchors: readonly (readonly [number, number])[]) => {
  const a: [number, number][] = [];
  for (const [ay, ap] of anchors) {
    const prev = a.at(-1);
    a.push(prev ? [Math.max(ay, prev[0]), Math.max(ap, prev[1])] : [ay, ap]);
  }
  if (a.length === 0) return 0;
  const first = a[0]!;
  const last = a.at(-1)!;
  if (y <= first[0]) return first[1];
  if (y >= last[0]) return last[1];
  for (let i = 1; i < a.length; i++) {
    const [y0, p0] = a[i - 1]!;
    const [y1, p1] = a[i]!;
    if (y <= y1) return y1 === y0 ? p1 : p0 + ((y - y0) / (y1 - y0)) * (p1 - p0);
  }
  return last[1];
};

/** One damped step toward `target` (frame-rate independent); snaps when close enough. */
export const follow = (current: number, target: number, dtMs: number, halfLifeMs = 90) => {
  const next = target + (current - target) * 2 ** (-dtMs / halfLifeMs);
  return Math.abs(next - target) < 0.0005 ? target : next;
};

/** Calls `onChange(read())` at most once per frame while the page scrolls or resizes. */
export const watchProgress = (read: () => number, onChange: (p: number) => void) => {
  let frame = 0;
  let last = -1;
  const tick = () => {
    frame = 0;
    const p = read();
    if (p !== last) onChange((last = p));
  };
  const schedule = () => {
    if (!frame) frame = requestAnimationFrame(tick);
  };
  addEventListener('scroll', schedule, { passive: true });
  addEventListener('resize', schedule, { passive: true });
  tick();
  return () => {
    removeEventListener('scroll', schedule);
    removeEventListener('resize', schedule);
    if (frame) cancelAnimationFrame(frame);
  };
};
