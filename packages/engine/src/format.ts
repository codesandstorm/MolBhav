import { Rational } from './rational.ts';

/** Indian digit grouping of a non-negative integer string: last three digits, then pairs. */
const groupIndian = (digits: string): string => {
  if (digits.length <= 3) return digits;
  const last3 = digits.slice(-3);
  let rest = digits.slice(0, -3);
  const parts: string[] = [];
  while (rest.length > 2) {
    parts.unshift(rest.slice(-2));
    rest = rest.slice(0, -2);
  }
  if (rest.length > 0) parts.unshift(rest);
  return `${parts.join(',')},${last3}`;
};

/** ₹ with Indian grouping, no decimals (spec 13 §6). Negative values use a minus sign. */
export const formatINR = (rupees: bigint): string => {
  const neg = rupees < 0n;
  const s = groupIndian((neg ? -rupees : rupees).toString());
  return `${neg ? '−' : ''}₹${s}`;
};

/**
 * ₹ for an exact value that may have paise: whole rupees are printed as formatINR;
 * otherwise two decimals, half-up, display only (spec 13 §3.6).
 */
export const formatINRExact = (x: Rational): { text: string; approx: boolean } => {
  if (x.isInteger()) return { text: formatINR(x.n), approx: false };
  const fixed = x.toFixedHalfUp(2);
  const neg = fixed.startsWith('-');
  const [w = '0', f = '00'] = (neg ? fixed.slice(1) : fixed).split('.');
  const approx = !Rational.parse(fixed)!.eq(x);
  return { text: `${neg ? '−' : ''}₹${groupIndian(w)}.${f}`, approx };
};

/** A plain exact decimal (e.g. buffered days), up to 2 places half-up, trailing zeros removed. */
export const formatDecimal = (x: Rational): { text: string; approx: boolean } => {
  if (x.isInteger()) return { text: groupIndian(x.n.toString()), approx: false };
  const fixed = x.toFixedHalfUp(2);
  const approx = !Rational.parse(fixed)!.eq(x);
  const trimmed = fixed.replace(/0+$/, '').replace(/\.$/, '');
  const [w = '0', f] = trimmed.split('.');
  return { text: f ? `${groupIndian(w)}.${f}` : groupIndian(w), approx };
};

const LAKH = 100_000n;
const CRORE = 10_000_000n;

/** Display-only short form for values ≥ ₹1,00,000: "₹1.25 lakh", "₹2.4 crore" (spec 13 §6). */
export const formatShort = (rupees: bigint): string | null => {
  if (rupees < LAKH) return null;
  const [unit, word] = rupees >= CRORE ? [CRORE, 'crore'] : [LAKH, 'lakh'];
  const v = Rational.of(rupees, unit).toFixedHalfUp(2).replace(/0+$/, '').replace(/\.$/, '');
  return `₹${v} ${word}`;
};
