/**
 * Falls back to the static poster when the scene cannot keep up
 * (docs/product/08_experience_and_brand.md §8.3: below 30 fps for 2 s → poster).
 * Only frames that are actually rendered while animating are sampled; a pause longer than
 * `idleGapMs` (the visitor stopped scrolling, so nothing renders) starts a new window.
 */
export const createFpsGuard = (minFps = 30, windowMs = 2000, idleGapMs = 250) => {
  const frames: number[] = [];
  return (now: number): boolean => {
    const last = frames.at(-1);
    if (last !== undefined && now - last > idleGapMs) frames.length = 0;
    frames.push(now);
    while (frames.length > 1 && now - (frames[0] ?? now) > windowMs) frames.shift();
    const span = now - (frames[0] ?? now);
    if (span < windowMs * 0.95) return false;
    const fps = ((frames.length - 1) * 1000) / span;
    return fps < minFps;
  };
};

/** True when WebGL can be created; checked before any 3D code is downloaded. */
export const canUseWebGL = (): boolean => {
  try {
    const c = document.createElement('canvas');
    return Boolean(c.getContext('webgl2') ?? c.getContext('webgl'));
  } catch {
    return false;
  }
};

/** Save-Data (Network Information API, Chromium only) also gets the poster. */
export const wantsSaveData = (): boolean =>
  Boolean((navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData);
