import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { computeLadder, Rational, type LadderInput, type LadderOk } from '../src/index.ts';
import { validInput } from './arbitraries.ts';

const RUNS = { numRuns: 2000, seed: 42 };

const ok = (i: LadderInput): LadderOk => {
  const r = computeLadder(i);
  if (!r.ok) throw new Error(`expected a valid ladder, got ${r.error} for ${JSON.stringify(i)}`);
  return r;
};

describe('spec §7 property 1: floor ≤ target ≤ opening', () => {
  it('holds for every valid input', () => {
    fc.assert(
      fc.property(validInput, (i) => {
        const r = ok(i);
        expect(r.floor <= r.target).toBe(true);
        expect(r.target <= r.opening).toBe(true);
      }),
      RUNS,
    );
  });
});

describe('spec §7 property 2: monotonicity', () => {
  const bump = (field: 'M' | 'C' | 'b' | 't' | 'a', max: number) =>
    fc.property(validInput, fc.integer({ min: 1, max }), (i, d) => {
      const cur = i[field] as number;
      const up = Math.min(cur + d, max);
      if (field === 'C' && i.u === 'hour' && i.e === null) return; // C must stay 0 here
      const lo = ok(i);
      const hi = ok({ ...i, [field]: up });
      expect(hi.floor >= lo.floor).toBe(true);
      expect(hi.target >= lo.target).toBe(true);
      expect(hi.opening >= lo.opening).toBe(true);
    });
  it('increasing M never lowers an output', () => fc.assert(bump('M', 100_000_000), RUNS));
  it('increasing C never lowers an output', () => fc.assert(bump('C', 100_000_000), RUNS));
  it('increasing b never lowers an output', () => fc.assert(bump('b', 100), RUNS));
  it('increasing t never lowers target or opening', () => fc.assert(bump('t', 300), RUNS));
  it('increasing a never lowers the opening', () => fc.assert(bump('a', 300), RUNS));

  it('increasing K never raises an output', () => {
    fc.assert(
      fc.property(validInput, fc.integer({ min: 1, max: 5000 }), (i, d) => {
        const max = i.eu === 'day' ? 3100 : 74400;
        const kN = Math.round(Number(i.K) * 100);
        const up = Math.min(kN + d, max);
        const lo = ok(i);
        const hi = ok({ ...i, K: up / 100 });
        expect(hi.floor <= lo.floor).toBe(true);
        expect(hi.target <= lo.target).toBe(true);
        expect(hi.opening <= lo.opening).toBe(true);
      }),
      RUNS,
    );
  });

  it('increasing e: never lowers for fixed/month, never raises for hour', () => {
    fc.assert(
      fc.property(validInput, fc.integer({ min: 1, max: 100_000 }), (i, d) => {
        if (i.e === null) return;
        const eN = Math.round(Number(i.e) * 100);
        let upN = Math.min(eN + d, 1_000_000);
        if (i.u === 'month') upN = Math.min(upN, Math.round(Number(i.K) * 100));
        const lo = ok(i);
        const hi = ok({ ...i, e: upN / 100 });
        if (i.u === 'hour') {
          expect(hi.floor <= lo.floor).toBe(true);
          expect(hi.opening <= lo.opening).toBe(true);
        } else {
          expect(hi.floor >= lo.floor).toBe(true);
          expect(hi.opening >= lo.opening).toBe(true);
        }
      }),
      RUNS,
    );
  });
});

describe('spec §7 property 3: positive, multiples of the step', () => {
  it('holds', () => {
    fc.assert(
      fc.property(validInput, (i) => {
        const r = ok(i);
        const s = i.u === 'hour' ? 10n : 100n;
        expect(r.step).toBe(s);
        for (const v of [r.floor, r.target, r.opening]) {
          expect(v > 0n).toBe(true);
          expect(v % s).toBe(0n);
        }
      }),
      RUNS,
    );
  });
});

describe('spec §7 property 4: rounding is stable', () => {
  it('ceil of ceil equals ceil, including values above 2^53', () => {
    fc.assert(
      fc.property(
        fc.bigInt({ min: 0n, max: 2n ** 90n }),
        fc.bigInt({ min: 1n, max: 2n ** 60n }),
        fc.constantFrom(10n, 100n),
        (n, d, s) => {
          const once = Rational.of(n, d).ceilToStep(s);
          expect(Rational.of(once).ceilToStep(s)).toBe(once);
        },
      ),
      RUNS,
    );
  });
  it('an exact value on a step boundary is unchanged, including values above 2^53', () => {
    fc.assert(
      fc.property(fc.bigInt({ min: 1n, max: 2n ** 80n }), fc.constantFrom(10n, 100n), (k, s) => {
        expect(Rational.of(k * s).ceilToStep(s)).toBe(k * s);
        expect(Rational.of(k * s * 7n, 7n).ceilToStep(s)).toBe(k * s);
      }),
      RUNS,
    );
  });
});

describe('spec §7 property 5: rounding bounds', () => {
  it('exact ≤ rounded < exact + step', () => {
    fc.assert(
      fc.property(validInput, (i) => {
        const r = ok(i);
        const s = Rational.of(r.step);
        const pairs: [bigint, Rational][] = [
          [r.floor, r.exact.floor],
          [r.target, r.exact.target],
          [r.opening, r.exact.opening],
        ];
        for (const [rounded, exact] of pairs) {
          const R = Rational.of(rounded);
          expect(R.cmp(exact) >= 0).toBe(true);
          expect(R.cmp(exact.add(s)) < 0).toBe(true);
        }
      }),
      RUNS,
    );
  });
});

describe('spec §7 property 6: invalid input gives an error and no numbers', () => {
  const breakers: ((i: LadderInput) => LadderInput)[] = [
    (i) => ({ ...i, u: 'weekly' }),
    (i) => ({ ...i, M: 0 }),
    (i) => ({ ...i, M: -5 }),
    (i) => ({ ...i, M: '12.5' }),
    (i) => ({ ...i, K: 0 }),
    (i) => ({ ...i, K: 'abc' }),
    (i) => ({ ...i, C: -1 }),
    (i) => ({ ...i, b: 101 }),
    (i) => ({ ...i, t: 301 }),
    (i) => ({ ...i, a: -1 }),
    (i) => ({ ...i, e: i.u === 'hour' ? -1 : null }),
    (i) => ({ ...i, e: '1.234' }),
  ];
  it('holds', () => {
    fc.assert(
      fc.property(validInput, fc.integer({ min: 0, max: breakers.length - 1 }), (i, k) => {
        const r = computeLadder(breakers[k]!(i));
        expect(r.ok).toBe(false);
        expect('floor' in r).toBe(false);
        expect('target' in r).toBe(false);
        expect('opening' in r).toBe(false);
      }),
      RUNS,
    );
  });
});

describe('spec §7 property 7: label and trace', () => {
  it('every result is CALCULATION with a labelled trace', () => {
    fc.assert(
      fc.property(validInput, (i) => {
        const r = ok(i);
        expect(r.label).toBe('CALCULATION');
        expect(r.trace.length).toBeGreaterThanOrEqual(4);
        for (const step of r.trace) expect(step.label).toBe('CALCULATION');
      }),
      RUNS,
    );
  });
});

describe('exactness beyond 2^53 (independent integer reference)', () => {
  // floor(fixed) = ceil((M·eN·(100+b) + C·100·KN) / (100·KN·s)) · s, with e = eN/100, K = KN/100
  it('ladder core matches plain BigInt arithmetic for huge values', async () => {
    const { ladderCore } = await import('../src/index.ts');
    fc.assert(
      fc.property(
        fc.bigInt({ min: 1n, max: 2n ** 70n }),
        fc.bigInt({ min: 0n, max: 2n ** 70n }),
        fc.bigInt({ min: 1n, max: 2n ** 40n }),
        fc.bigInt({ min: 1n, max: 2n ** 40n }),
        fc.bigInt({ min: 0n, max: 100n }),
        fc.bigInt({ min: 0n, max: 300n }),
        fc.bigInt({ min: 0n, max: 300n }),
        (M, C, eN, KN, b, t, a) => {
          const r = ladderCore({
            u: 'fixed',
            e: Rational.of(eN, 100n),
            K: Rational.of(KN, 100n),
            M: Rational.of(M),
            C: Rational.of(C),
            b,
            t,
            a,
          });
          const s = 100n;
          const ceilDiv = (x: bigint, y: bigint) => (x + y - 1n) / y;
          const num = M * eN * (100n + b) + C * 100n * KN;
          const den = 100n * KN;
          expect(r.floor).toBe(ceilDiv(num, den * s) * s);
          expect(r.target).toBe(ceilDiv(num * (100n + t), den * 100n * s) * s);
          expect(r.opening).toBe(ceilDiv(num * (100n + t) * (100n + a), den * 10000n * s) * s);
        },
      ),
      { numRuns: 1000, seed: 42 },
    );
  });

  it('really exercises values above 2^53', async () => {
    const { ladderCore } = await import('../src/index.ts');
    const r = ladderCore({
      u: 'fixed',
      e: Rational.of(7n),
      K: Rational.of(18n),
      M: Rational.of(2n ** 70n),
      C: Rational.of(0n),
      b: 0n,
      t: 20n,
      a: 15n,
    });
    expect(r.floor > 2n ** 53n).toBe(true);
    // ceil(2^70 * 7 / 18 / 100) * 100, by hand: 2^70*7 = 8264141345021879123968; /1800 = 4591189636123266179.98... -> ceil 4591189636123266180 -> *100
    expect(r.floor).toBe(459118963612326618000n);
  });
});

describe('spec 13 v0.3 §3.5: concession room from the displayed rungs', () => {
  it('never exceeds the true room of the displayed rungs, is its floor, and is 0 when O = T', () => {
    fc.assert(
      fc.property(validInput, (i) => {
        const r = ok(i);
        const trueRoom = Rational.of(100n * (r.opening - r.target), r.opening);
        const shown = Rational.of(r.concessionRoomPct);
        expect(shown.cmp(trueRoom) <= 0).toBe(true);
        expect(shown.add(Rational.of(1n)).cmp(trueRoom) > 0).toBe(true);
        if (r.opening === r.target) expect(r.concessionRoomPct).toBe(0n);
      }),
      RUNS,
    );
  });
});
