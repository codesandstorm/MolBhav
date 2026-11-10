import fc from 'fast-check';
import type { LadderInput } from '../src/index.ts';

/** A decimal string with up to two decimal places, from an integer count of hundredths. */
export const hundredths = (n: number): string => {
  const whole = Math.floor(n / 100);
  const frac = n % 100;
  return frac === 0 ? String(whole) : `${whole}.${String(frac).padStart(2, '0')}`;
};

/** Valid inputs per spec §2 and §5.2. Decimals are passed as strings or numbers at random. */
export const validInput: fc.Arbitrary<LadderInput> = fc
  .record({
    u: fc.constantFrom('fixed' as const, 'hour' as const, 'month' as const),
    euPick: fc.constantFrom('day' as const, 'hour' as const),
    kDays: fc.integer({ min: 100, max: 3100 }),
    kHours: fc.integer({ min: 100, max: 74400 }),
    eRaw: fc.integer({ min: 1, max: 1_000_000 }),
    withE: fc.boolean(),
    M: fc.integer({ min: 1, max: 100_000_000 }),
    C: fc.integer({ min: 0, max: 100_000_000 }),
    b: fc.integer({ min: 0, max: 100 }),
    t: fc.integer({ min: 0, max: 300 }),
    a: fc.integer({ min: 0, max: 300 }),
    asString: fc.boolean(),
  })
  .map((r) => {
    const eu = r.u === 'hour' ? 'hour' : r.euPick;
    const kN = eu === 'day' ? r.kDays : r.kHours;
    let eN = r.eRaw;
    if (r.u === 'month') eN = 1 + (r.eRaw % kN); // e <= K
    const e = r.u === 'hour' && !r.withE ? null : hundredths(eN);
    const C = r.u === 'hour' && e === null ? 0 : r.C;
    const toVal = (s: string): string | number => (r.asString ? s : Number(s));
    return {
      u: r.u,
      eu,
      e: e === null ? null : toVal(e),
      K: toVal(hundredths(kN)),
      M: r.M,
      C,
      b: r.b,
      t: r.t,
      a: r.a,
    } satisfies LadderInput;
  });
