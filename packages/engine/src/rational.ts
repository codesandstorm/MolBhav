/**
 * Exact rational numbers on BigInt. Every money value in the engine is a Rational
 * (or a bigint of whole rupees); floating point never touches money (spec 13 §3).
 */
const abs = (x: bigint): bigint => (x < 0n ? -x : x);
const gcd = (a: bigint, b: bigint): bigint => {
  a = abs(a);
  b = abs(b);
  while (b !== 0n) [a, b] = [b, a % b];
  return a;
};
/** Floor division for bigints (rounds toward −∞). */
const floorDiv = (n: bigint, d: bigint): bigint => {
  const q = n / d;
  return n % d !== 0n && n < 0n !== d < 0n ? q - 1n : q;
};

const DECIMAL = /^([+-]?)(\d+)(?:\.(\d+))?(?:[eE]([+-]?\d+))?$/;

const MAX_EXPONENT = 30n;

export class Rational {
  /** numerator; sign lives here */
  readonly n: bigint;
  /** denominator; always > 0, coprime with n */
  readonly d: bigint;

  private constructor(n: bigint, d: bigint) {
    if (d === 0n) throw new RangeError('division by zero');
    if (d < 0n) {
      n = -n;
      d = -d;
    }
    const g = gcd(n, d) || 1n;
    this.n = n / g;
    this.d = d / g;
  }

  static of(n: bigint, d: bigint = 1n): Rational {
    return new Rational(n, d);
  }

  /**
   * Parses a plain decimal string (optionally with an exponent, as String(number) can produce).
   * Returns null for anything else (text, NaN, Infinity, empty).
   */
  /** Exact decimal parse; null for non-numbers and for exponents with |exp| > 30. */
  static parse(s: string): Rational | null {
    const m = DECIMAL.exec(s.trim());
    if (!m) return null;
    const [, sign, int = '0', frac = '', exp = '0'] = m;
    // An exponent like 1e999999999 would build a huge BigInt and hang; no real input needs more than 30.
    const e = BigInt(exp);
    if (e > MAX_EXPONENT || e < -MAX_EXPONENT) return null;
    let n = BigInt(int + frac);
    if (sign === '-') n = -n;
    const scale = BigInt(frac.length) - e;
    return scale >= 0n ? new Rational(n, 10n ** scale) : new Rational(n * 10n ** -scale, 1n);
  }

  /** Number of decimal places needed to write this value exactly, or null if it does not terminate. */
  decimalPlaces(): bigint | null {
    let d = this.d;
    let twos = 0n;
    let fives = 0n;
    while (d % 2n === 0n) {
      d /= 2n;
      twos += 1n;
    }
    while (d % 5n === 0n) {
      d /= 5n;
      fives += 1n;
    }
    if (d !== 1n) return null;
    return twos > fives ? twos : fives;
  }

  isInteger(): boolean {
    return this.d === 1n;
  }

  add(o: Rational): Rational {
    return new Rational(this.n * o.d + o.n * this.d, this.d * o.d);
  }
  sub(o: Rational): Rational {
    return new Rational(this.n * o.d - o.n * this.d, this.d * o.d);
  }
  mul(o: Rational): Rational {
    return new Rational(this.n * o.n, this.d * o.d);
  }
  div(o: Rational): Rational {
    return new Rational(this.n * o.d, this.d * o.n);
  }
  cmp(o: Rational): -1 | 0 | 1 {
    const l = this.n * o.d;
    const r = o.n * this.d;
    return l < r ? -1 : l > r ? 1 : 0;
  }
  eq(o: Rational): boolean {
    return this.cmp(o) === 0;
  }

  /** s × ⌈x / s⌉ for a positive integer step s (spec 13 §3.3). */
  ceilToStep(step: bigint): bigint {
    if (step <= 0n) throw new RangeError('step must be positive');
    const q = -floorDiv(-this.n, this.d * step);
    return q * step;
  }

  /** ⌊x⌋ */
  floor(): bigint {
    return floorDiv(this.n, this.d);
  }

  /** Display only: decimal string with `places` decimals, rounded half-up (away from zero for ties). */
  toFixedHalfUp(places: number): string {
    const scale = 10n ** BigInt(places);
    const neg = this.n < 0n;
    const n = abs(this.n) * scale;
    const q = (2n * n + this.d) / (2n * this.d);
    const digits = q.toString().padStart(places + 1, '0');
    const whole = digits.slice(0, digits.length - places);
    const frac = digits.slice(digits.length - places);
    return (neg && q !== 0n ? '-' : '') + (places > 0 ? `${whole}.${frac}` : whole);
  }
}
