import { describe, expect, it } from 'vitest';
import { LABEL_GAP, PAD, place, spread } from '../src/quote-track.ts';

describe('quote track layout', () => {
  it('places values between the padded ends, in order', () => {
    expect(place(38000n, 38000n, 52500n)).toBe(PAD);
    expect(place(52500n, 38000n, 52500n)).toBe(100 - PAD);
    const mid = place(45600n, 38000n, 52500n);
    expect(mid).toBeGreaterThan(PAD);
    expect(mid).toBeLessThan(100 - PAD);
  });
  it('clamps outside the range and survives an empty range', () => {
    expect(place(1n, 10n, 20n)).toBe(PAD);
    expect(place(99n, 10n, 20n)).toBe(100 - PAD);
    expect(place(5n, 5n, 5n)).toBe(50);
  });
  it('keeps labels apart, in order and inside the track', () => {
    for (const xs of [
      [6, 7, 8],
      [92, 93, 94],
      [6, 50, 94],
      [40, 41, 90],
    ] as [number, number, number][]) {
      const [a, b, c] = spread(xs);
      expect(b - a).toBeGreaterThanOrEqual(LABEL_GAP - 1e-9);
      expect(c - b).toBeGreaterThanOrEqual(LABEL_GAP - 1e-9);
      expect(a).toBeGreaterThanOrEqual(PAD);
      expect(c).toBeLessThanOrEqual(100 - PAD);
    }
  });
  it('leaves well-spaced labels where their ticks are', () => {
    expect(spread([20, 50, 80])).toEqual([20, 50, 80]);
  });
});
