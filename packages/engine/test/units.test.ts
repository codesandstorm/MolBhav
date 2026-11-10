import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { computeLadder, formatINR, formatShort, Rational } from '../src/index.ts';

// Only values worked by hand in the spec itself (13 §3.5, §3.6, §6) are used here.
describe('spec illustration (13 §3.6)', () => {
  it('₹90,000 need, 7 of 18 days, ₹3,000 costs → 38,000 / 45,600 / 52,500, room 13%', () => {
    const r = computeLadder({
      u: 'fixed',
      eu: 'day',
      e: 7,
      K: 18,
      M: 90000,
      C: 3000,
      b: 0,
      t: 20,
      a: 15,
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect([r.floor, r.target, r.opening]).toEqual([38000n, 45600n, 52500n]);
    expect(r.concessionRoomPct).toBe(13n);
    expect(r.warnings).toEqual([]);
  });
  it('t and a default to 20 and 15 when missing (§5.1)', () => {
    const r = computeLadder({ u: 'fixed', eu: 'day', e: 7, K: 18, M: 90000, C: 3000 });
    if (!r.ok) throw new Error(r.error);
    expect([r.target, r.opening]).toEqual([45600n, 52500n]);
  });
});

describe('concession room (13 v0.3 §3.5)', () => {
  it('exact floor ₹11/hour → rungs 20 / 20 / 20 → room 0, "no room at this price"', () => {
    // M(1 + b/100)/K = 1,100 / 100 = 11 exactly; 11 → 20, 13.2 → 20, 15.18 → 20 (step ₹10)
    const r = computeLadder({ u: 'hour', eu: 'hour', K: 100, M: 1100, b: 0, t: 20, a: 15 });
    if (!r.ok) throw new Error(r.error);
    expect([r.floor, r.target, r.opening]).toEqual([20n, 20n, 20n]);
    expect(r.concessionRoomPct).toBe(0n);
    expect(r.trace.at(-1)).toMatchObject({ id: 'room', result: 'no room at this price' });
  });
  it('illustration: (52,500 − 45,600) / 52,500 = 13.14… → 13%', () => {
    const r = computeLadder({ u: 'fixed', eu: 'day', e: 7, K: 18, M: 90000, C: 3000 });
    if (!r.ok) throw new Error(r.error);
    expect(r.trace.at(-1)).toMatchObject({ id: 'room', result: '13%' });
  });
});

describe('huge exponents are rejected fast (spec 13 §5.2 field errors)', () => {
  const base = { u: 'fixed', eu: 'day', e: 7, K: 18, M: 90000, C: 3000, b: 0, t: 20, a: 15 };
  const expected: Record<string, string> = {
    e: 'e_out_of_range',
    K: 'K_out_of_range',
    M: 'not_whole_rupees',
    C: 'not_whole_rupees',
    b: 'b_out_of_range',
    t: 't_out_of_range',
    a: 'a_out_of_range',
  };
  for (const v of ['1e999999999', '1e-999999999']) {
    for (const [field, code] of Object.entries(expected))
      it(`${field} = ${v} → ${code} within 50 ms`, () => {
        const start = performance.now();
        const r = computeLadder({ ...base, [field]: v });
        expect(performance.now() - start).toBeLessThan(50);
        expect(r.ok ? 'OK' : r.error).toBe(code);
      });
    it(`Q = ${v} → quote error within 50 ms, ladder still valid`, () => {
      const start = performance.now();
      const r = computeLadder({ ...base, Q: v });
      expect(performance.now() - start).toBeLessThan(50);
      if (!r.ok) throw new Error(r.error);
      expect(r.quote).toEqual({ error: 'not_whole_rupees' });
    });
  }
  it('Rational.parse caps |exponent| at 30', () => {
    expect(Rational.parse('1e30')?.eq(Rational.of(10n ** 30n))).toBe(true);
    expect(Rational.parse('1e31')).toBeNull();
    expect(Rational.parse('1e-31')).toBeNull();
  });
});

describe('quote marker (13 §3.4)', () => {
  const base = {
    u: 'fixed',
    eu: 'day',
    e: 7,
    K: 18,
    M: 90000,
    C: 3000,
    b: 0,
    t: 20,
    a: 15,
  } as const;
  const pos = (Q: number) => {
    const r = computeLadder({ ...base, Q });
    if (!r.ok || !r.quote || 'error' in r.quote) throw new Error('no quote');
    return r.quote;
  };
  it('positions against 38,000 / 45,600 / 52,500', () => {
    expect(pos(30000).position).toBe('below_floor');
    expect(pos(30000).differenceFromFloor).toBe(-8000n);
    expect(pos(38000).position).toBe('floor_to_target');
    expect(pos(45600).position).toBe('target_to_opening');
    expect(pos(52500).position).toBe('at_or_above_opening');
  });
});

describe('warnings (13 §5.3)', () => {
  it('unusually_large only when the rounded floor is strictly above ₹1,00,00,000', () => {
    // floor = M exactly when e = K and C = 0, b = 0 (fixed)
    const at = computeLadder({ u: 'fixed', eu: 'day', e: 20, K: 20, M: 10_000_000, C: 0 });
    const above = computeLadder({ u: 'fixed', eu: 'day', e: 20, K: 20, M: 10_000_001, C: 0 });
    if (!at.ok || !above.ok) throw new Error('invalid');
    expect(at.floor).toBe(10_000_000n);
    expect(at.warnings).toEqual([]);
    expect(above.warnings).toEqual(['unusually_large']);
  });
});

describe('formatting (13 §6)', () => {
  it('Indian grouping', () => {
    expect(formatINR(999n)).toBe('₹999');
    expect(formatINR(1000n)).toBe('₹1,000');
    expect(formatINR(38000n)).toBe('₹38,000');
    expect(formatINR(120000n)).toBe('₹1,20,000');
    expect(formatINR(123456700n)).toBe('₹12,34,56,700');
    expect(formatINR(-8000n)).toBe('−₹8,000');
  });
  it('short forms', () => {
    expect(formatShort(99900n)).toBeNull();
    expect(formatShort(125000n)).toBe('₹1.25 lakh');
    expect(formatShort(24000000n)).toBe('₹2.4 crore');
    expect(formatShort(100000n)).toBe('₹1 lakh');
  });
});

describe('Rational', () => {
  it('parses decimal strings exactly, including exponents', () => {
    expect(Rational.parse('7.25')?.eq(Rational.of(29n, 4n))).toBe(true);
    expect(Rational.parse('1e+21')?.eq(Rational.of(10n ** 21n))).toBe(true);
    expect(Rational.parse('1e999999999')).toBeNull();
    expect(Rational.parse('abc')).toBeNull();
    expect(Rational.parse('NaN')).toBeNull();
    expect(Rational.parse('Infinity')).toBeNull();
  });
  it('display rounding is half-up to 2 places', () => {
    expect(Rational.of(1n, 3n).toFixedHalfUp(2)).toBe('0.33');
    expect(Rational.of(2n, 3n).toFixedHalfUp(2)).toBe('0.67');
    expect(Rational.of(1n, 8n).toFixedHalfUp(2)).toBe('0.13');
  });
});

describe('no floating point touches money (engine source scan)', () => {
  it('the engine source uses no Math, parseFloat, parseInt, Number(), toFixed or fractional literals', () => {
    const dir = join(import.meta.dirname, '..', 'src');
    const banned =
      /\bMath\.|\bparseFloat\b|\bparseInt\b|\bNumber\s*\(|\bNumber\.|\.toFixed\(|\.toPrecision\(|(?<![\w.])\d+\.\d+(?![\w.])/;
    for (const f of readdirSync(dir).filter((x) => x.endsWith('.ts'))) {
      // blank out block comments (keeping line numbers), then scan code only
      const src = readFileSync(join(dir, f), 'utf8').replace(/\/\*[\s\S]*?\*\//g, (m) =>
        m.replace(/[^\n]/g, ' '),
      );
      const lines = src.split('\n');
      lines.forEach((line, n) => {
        const code = line.replace(/\/\/.*$/, '').replace(/'[^']*'|`[^`]*`|"[^"]*"/g, "''");
        if (banned.test(code)) throw new Error(`${f}:${n + 1}: ${line.trim()}`);
      });
    }
  });
  it('public money fields are bigint, never number', () => {
    const r = computeLadder({ u: 'fixed', eu: 'day', e: 7, K: 18, M: 90000, C: 3000 });
    if (!r.ok) throw new Error(r.error);
    for (const v of [r.floor, r.target, r.opening, r.step, r.concessionRoomPct])
      expect(typeof v).toBe('bigint');
  });
});
