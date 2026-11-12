import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { ceilToStep, concessionSteps, stepCounter, tradeCounter } from '../src/steps.ts';

describe('S-1 to S-3: concession steps (18 §6)', () => {
  it('the worked example in 18 §6', () => {
    expect(concessionSteps(52500n, 45600n, 100n)).toEqual([
      49100n,
      47400n,
      46500n,
      46100n,
      45900n,
      45800n,
      45700n,
    ]);
    expect(stepCounter(52500n, 45600n, 100n)).toBe(49100n);
    expect(tradeCounter(52500n, 45600n, 100n)).toBe(50800n);
  });
  it('no step when the price is at or below the target, or the midpoint rounds back up', () => {
    expect(stepCounter(45600n, 45600n, 100n)).toBeNull();
    expect(stepCounter(45000n, 45600n, 100n)).toBeNull();
    expect(stepCounter(45700n, 45600n, 100n)).toBeNull();
    expect(tradeCounter(45700n, 45600n, 100n)).toBeNull();
  });
  it('ceilToStep rounds up to the step, exactly', () => {
    expect(ceilToStep(98100n, 2n, 100n)).toBe(49100n);
    expect(ceilToStep(98000n, 2n, 100n)).toBe(49000n);
    expect(ceilToStep(1n, 1n, 10n)).toBe(10n);
  });

  const grid = (s: bigint) => fc.bigInt({ min: 1n, max: 200_000n }).map((k) => k * s);
  const step = fc.constantFrom(10n, 100n);

  it('property: prices strictly decrease, stay ≥ T and on the grid; steps never grow (P on the grid)', () => {
    fc.assert(
      fc.property(
        step,
        fc.bigInt({ min: 1n, max: 200_000n }),
        fc.bigInt({ min: 0n, max: 200_000n }),
        (s, t, g) => {
          const T = t * s;
          const P = T + g * s;
          const seq = concessionSteps(P, T, s);
          let prev = P;
          let prevStep: bigint | null = null;
          for (const c of seq) {
            expect(c).toBeLessThan(prev);
            expect(c).toBeGreaterThanOrEqual(T);
            expect(c % s).toBe(0n);
            const d = prev - c;
            if (prevStep !== null) expect(d).toBeLessThanOrEqual(prevStep);
            prevStep = d;
            prev = c;
          }
        },
      ),
      { numRuns: 2500 },
    );
  });

  it('property: with P off the grid, the steps from the first counter on never grow', () => {
    fc.assert(
      fc.property(step, grid(100n), fc.bigInt({ min: 1n, max: 2_000_000n }), (s, T, g) => {
        const P = T + g;
        const seq = concessionSteps(P, T, s);
        for (let i = 2; i < seq.length; i++)
          expect(seq[i - 1]! - seq[i]!).toBeLessThanOrEqual(seq[i - 2]! - seq[i - 1]!);
        for (const c of seq) expect(c).toBeGreaterThanOrEqual(T);
        // a trade never moves further than a step
        const sc = stepCounter(P, T, s);
        const tc = tradeCounter(P, T, s);
        if (sc !== null && tc !== null) expect(tc).toBeGreaterThanOrEqual(sc);
      }),
      { numRuns: 2500 },
    );
  });
});
