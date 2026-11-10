import { describe, expect, it } from 'vitest';
import { createFpsGuard } from '../src/lib/fps-guard.ts';

const run = (guard: (t: number) => boolean, fps: number, ms: number, t0 = 0) => {
  let out = false;
  for (let t = t0; t <= t0 + ms; t += 1000 / fps) out = guard(t) || out;
  return out;
};

describe('fps guard (08 §8.3: below 30 fps for 2 s → poster)', () => {
  it('keeps the scene at 60 fps', () => expect(run(createFpsGuard(), 60, 5000)).toBe(false));
  it('keeps the scene at 31 fps', () => expect(run(createFpsGuard(), 31, 5000)).toBe(false));
  it('falls back at 20 fps sustained for 2 s', () =>
    expect(run(createFpsGuard(), 20, 2500)).toBe(true));
  it('does not fall back on a short stutter under 2 s', () =>
    expect(run(createFpsGuard(), 20, 1500)).toBe(false));
  it('does not count idle time between scroll bursts as slow frames', () => {
    const g = createFpsGuard();
    expect(run(g, 60, 1000, 0)).toBe(false);
    expect(run(g, 60, 1500, 4000)).toBe(false);
  });
});
