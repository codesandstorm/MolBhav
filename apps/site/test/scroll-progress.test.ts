// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { follow, piecewise, progressFrom, watchProgress } from '../src/lib/scroll-progress.ts';

describe('progressFrom', () => {
  it('is 0 at the top and 1 at the end', () => {
    expect(progressFrom(0, 3000, 800)).toBe(0);
    expect(progressFrom(-(3000 - 800 * 0.85), 3000, 800)).toBe(1);
  });
  it('is linear in between and clamped outside', () => {
    expect(progressFrom(-1160, 3000, 800)).toBeCloseTo(0.5, 5);
    expect(progressFrom(400, 3000, 800)).toBe(0);
    expect(progressFrom(-9000, 3000, 800)).toBe(1);
  });
  it('is 1 when the element is shorter than the scroll range', () => {
    expect(progressFrom(0, 500, 800)).toBe(1);
  });
});

describe('piecewise', () => {
  const a = [
    [0, 0],
    [100, 0.5],
    [300, 1],
  ] as const;
  it('interpolates between anchors and clamps outside', () => {
    expect(piecewise(-50, a)).toBe(0);
    expect(piecewise(50, a)).toBe(0.25);
    expect(piecewise(200, a)).toBe(0.75);
    expect(piecewise(900, a)).toBe(1);
  });
  it('repairs anchors that are out of order (short pages)', () => {
    const bad = [
      [0, 0],
      [200, 0.5],
      [100, 0.8],
      [400, 1],
    ] as const;
    let prev = 0;
    for (let y = 0; y <= 400; y += 5) {
      const p = piecewise(y, bad);
      expect(p).toBeGreaterThanOrEqual(prev);
      prev = p;
    }
    expect(piecewise(400, bad)).toBe(1);
  });
});

describe('follow', () => {
  it('moves halfway in one half-life and never overshoots', () => {
    expect(follow(0, 1, 90, 90)).toBeCloseTo(0.5, 5);
    let x = 0;
    for (let i = 0; i < 200; i++) {
      x = follow(x, 1, 16);
      expect(x).toBeLessThanOrEqual(1);
    }
    expect(x).toBe(1);
  });
  it('is frame-rate independent', () => {
    let a = 0;
    let b = 0;
    for (let i = 0; i < 6; i++) a = follow(a, 1, 16);
    for (let i = 0; i < 3; i++) b = follow(b, 1, 32);
    expect(a).toBeCloseTo(b, 6);
  });
});

describe('watchProgress', () => {
  afterEach(() => vi.restoreAllMocks());
  it('reads layout at most once per frame and stops after cleanup', () => {
    const frames: FrameRequestCallback[] = [];
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => frames.push(cb));
    const el = document.createElement('div');
    let top = 0;
    const rect = vi
      .spyOn(el, 'getBoundingClientRect')
      .mockImplementation(() => ({ top, height: 3000 }) as DOMRect);
    const seen: number[] = [];
    const read = () => {
      const r = el.getBoundingClientRect();
      return progressFrom(r.top, r.height, window.innerHeight);
    };
    const stop = watchProgress(read, (p) => seen.push(p));
    expect(seen).toEqual([0]);
    top = -1160;
    for (let i = 0; i < 5; i++) window.dispatchEvent(new Event('scroll'));
    expect(frames).toHaveLength(1); // five scroll events, one scheduled read
    frames.shift()?.(0);
    expect(rect).toHaveBeenCalledTimes(2);
    expect(seen.at(-1)).toBe(progressFrom(-1160, 3000, window.innerHeight));
    stop();
    window.dispatchEvent(new Event('scroll'));
    expect(frames).toHaveLength(0);
  });
});
