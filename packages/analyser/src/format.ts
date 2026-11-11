/**
 * Write an exact rupee amount in one of the card generator's formats
 * (docs/product/04_research_integrity.md §2 step 2). Used by the prompt cards (to show the
 * author which format to use) and by the parser's property test (format → parse → same
 * integer). Exact: bigint and string arithmetic only, no floats.
 */
export const AMOUNT_FORMATS = ['rupee_comma', 'k', 'hazaar', 'lakh', 'per_hour', 'none'] as const;
export type AmountFormat = (typeof AMOUNT_FORMATS)[number];
export const HAZAAR_SPELLINGS = ['hazaar', 'hajar', 'hazar'] as const;
export type HazaarSpelling = (typeof HAZAAR_SPELLINGS)[number];

/** Indian digit grouping: last three digits, then pairs (4,50,000). */
export const groupIndian = (digits: string): string => {
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

/** rupees ÷ unit as an exact decimal string with trailing zeros removed (32500 ÷ 1000 → "32.5"). */
export const exactQuotient = (rupees: bigint, unit: bigint, places: number): string => {
  const whole = rupees / unit;
  const rem = rupees % unit;
  if (rem === 0n) return whole.toString();
  const frac = rem.toString().padStart(places, '0').replace(/0+$/, '');
  return `${whole}.${frac}`;
};

export const rupeeComma = (rupees: bigint): string => `₹${groupIndian(rupees.toString())}`;

/**
 * The amount written in a format. Throws when the format cannot write it exactly
 * (hazaar needs whole thousands; k and lakh are written with up to 3 and 5 decimals).
 */
export const formatAmount = (
  rupees: bigint,
  format: Exclude<AmountFormat, 'none'>,
  spelling: HazaarSpelling = 'hazaar',
): string => {
  if (rupees <= 0n) throw new Error('amount must be positive');
  switch (format) {
    case 'rupee_comma':
      return rupeeComma(rupees);
    case 'k':
      return `${exactQuotient(rupees, 1000n, 3)}k`;
    case 'hazaar':
      if (rupees % 1000n !== 0n) throw new Error('hazaar needs whole thousands');
      return `${rupees / 1000n} ${spelling}`;
    case 'lakh':
      return `${exactQuotient(rupees, 100000n, 5)}L`;
    case 'per_hour':
      return `${rupeeComma(rupees)} per hour`;
  }
};
