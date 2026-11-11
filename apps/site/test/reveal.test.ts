import { describe, expect, it } from 'vitest';
import { riseFrom } from '../src/lib/reveal.ts';

describe('product shot rise', () => {
  it('is 0 below the fold, 1 once risen three quarters of a viewport, linear between', () => {
    expect(riseFrom(1000, 800)).toBe(0);
    expect(riseFrom(800, 800)).toBe(0);
    expect(riseFrom(500, 800)).toBeCloseTo(0.5, 6);
    expect(riseFrom(200, 800)).toBe(1);
    expect(riseFrom(-400, 800)).toBe(1);
  });
});
