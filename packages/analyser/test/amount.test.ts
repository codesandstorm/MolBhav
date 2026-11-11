import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { findAmounts, hindiNumeral, normaliseWord, readAmount } from '../src/amount.ts';
import { AMOUNT_FORMATS, formatAmount, HAZAAR_SPELLINGS } from '../src/format.ts';

/*
 * Every message text below is a made-up tooling example written for this test, not gold.
 */
const read = (s: string) => {
  const r = readAmount(s);
  return {
    rupees: r.rupees,
    high: r.rupeesHigh,
    unit: r.unit,
    currency: r.currency,
    ambiguous: r.ambiguous,
  };
};

describe('every card-generator format', () => {
  // [format, text, rupees, high, unit]
  const table: [string, string, bigint, bigint | null, string][] = [
    ['rupee_comma', '₹45,000', 45000n, null, 'unspecified'],
    ['rupee_comma (Indian grouping)', '₹4,50,000', 450000n, null, 'unspecified'],
    ['rupee_comma per month', '₹15,000 per month', 15000n, null, 'month'],
    ['k', '45k', 45000n, null, 'unspecified'],
    ['k (decimal)', '32.5k', 32500n, null, 'unspecified'],
    ['k (capital)', '45K', 45000n, null, 'unspecified'],
    ['k range', '45-50k', 45000n, 50000n, 'unspecified'],
    ['hazaar', '45 hazaar', 45000n, null, 'unspecified'],
    ['hajar', '45 hajar', 45000n, null, 'unspecified'],
    ['hazar', '45 hazar', 45000n, null, 'unspecified'],
    ['hazaar range', '21-26 hazaar', 21000n, 26000n, 'unspecified'],
    ['lakh', '1.5L', 150000n, null, 'unspecified'],
    ['lakh (below one)', '0.95L', 95000n, null, 'unspecified'],
    ['lakh word', '1.5 lakh', 150000n, null, 'unspecified'],
    ['per_hour', '₹1,200 per hour', 1200n, null, 'hour'],
  ];
  it.each(table)('%s: %s', (_f, text, rupees, high, unit) => {
    expect(read(text)).toEqual({ rupees, high, unit, currency: 'INR', ambiguous: false });
  });
  it('format "none": no amount, not ambiguous', () => {
    expect(read('Can you share some past work first?')).toEqual({
      rupees: null,
      high: null,
      unit: null,
      currency: null,
      ambiguous: false,
    });
  });

  it('reads the amount on every one of the 300 prompt cards', () => {
    // the cards are generator output (prompts for the author), not gold messages
    const file = join(import.meta.dirname, '..', '..', '..', 'ml', 'gold', 'cards', 'cards.jsonl');
    const cards = readFileSync(file, 'utf8')
      .trim()
      .split('\n')
      .map(
        (l) =>
          JSON.parse(l) as {
            amount_text: string | null;
            amount_rupees: string | null;
            amount_high_rupees: string | null;
          },
      );
    let checked = 0;
    for (const c of cards) {
      if (c.amount_text === null) continue;
      const r = readAmount(c.amount_text);
      expect(r.rupees, c.amount_text).toBe(BigInt(c.amount_rupees!));
      expect(r.rupeesHigh, c.amount_text).toBe(
        c.amount_high_rupees === null ? null : BigInt(c.amount_high_rupees),
      );
      expect(r.ambiguous, c.amount_text).toBe(false);
      if (/per hour/.test(c.amount_text)) expect(r.unit).toBe('hour');
      if (/per month/.test(c.amount_text)) expect(r.unit).toBe('month');
      checked++;
    }
    expect(checked).toBe(cards.filter((c) => c.amount_text !== null).length);
  });
});

describe('currency marks, grouping, scales and number words', () => {
  const table: [string, bigint, bigint | null][] = [
    ['Rs 45000', 45000n, null],
    ['Rs. 45,000/-', 45000n, null],
    ['INR 45000', 45000n, null],
    ['45000 rupees', 45000n, null],
    ['45000 rupaye', 45000n, null],
    ['rs45000', 45000n, null],
    ['₹ 4,50,000', 450000n, null],
    ['450,000', 450000n, null],
    ['1.5 lakhs', 150000n, null],
    ['2 lac', 200000n, null],
    ['1.2 cr', 12000000n, null],
    ['tees hazaar', 30000n, null],
    ['paintalis hazaar', 45000n, null],
    ['pachas hazaar', 50000n, null],
    ['pachaas hajar', 50000n, null],
    ['thirty thousand', 30000n, null],
    ['forty-five thousand', 45000n, null],
    ['forty five thousand', 45000n, null],
    ['a lakh', 100000n, null],
    ['twelve hundred', 1200n, null],
    ['baarah sau', 1200n, null],
    ['do hazaar paanch sau', 2500n, null],
    ['ek lakh bees hazaar', 120000n, null],
    ['1 lakh 20 hazaar', 120000n, null],
    ['dedh lakh', 150000n, null],
    ['dhai hazaar', 2500n, null],
    ['sava lakh', 125000n, null],
    ['sava do lakh', 225000n, null],
    ['saade teen hazaar', 3500n, null],
    ['paune do lakh', 175000n, null],
    ['fifty rupees', 50n, null],
    ['40-45k', 40000n, 45000n],
    ['40k-45k', 40000n, 45000n],
    ['40k to 45k', 40000n, 45000n],
    ['40 to 45 thousand', 40000n, 45000n],
    ['40 se 45 hazaar', 40000n, 45000n],
    ['between 40 and 45k', 40000n, 45000n],
    ['₹40,000 - ₹45,000', 40000n, 45000n],
    ['1-1.5L', 100000n, 150000n],
    ['chalis se paintalis hazaar', 40000n, 45000n],
  ];
  it.each(table)('%s', (text, rupees, high) => {
    const r = readAmount(text);
    expect([r.rupees, r.rupeesHigh, r.ambiguous]).toEqual([rupees, high, false]);
  });
});

describe('units', () => {
  const table: [string, string][] = [
    ['1200/hr', 'hour'],
    ['₹1,200 an hour', 'hour'],
    ['1200 per hr', 'hour'],
    ['1500 hourly', 'hour'],
    ['ghante ka 1500', 'hour'],
    ['₹1500 ghante ka', 'hour'],
    ['8000 per day', 'day'],
    ['8k a day', 'day'],
    ['8k per din', 'day'],
    ['15k per month', 'month'],
    ['15k monthly', 'month'],
    ['15k pm', 'month'],
    ['har mahine 15k', 'month'],
    ['mahine ka 15 hazaar', 'month'],
    ['45k fixed', 'fixed'],
    ['total 45k', 'fixed'],
    ['45k for the whole thing', 'unspecified'],
  ];
  it.each(table)('%s → %s', (text, unit) => expect(readAmount(text).unit).toBe(unit));
});

describe('not prices (GUIDELINES §4 rule 2)', () => {
  const table: [string, string][] = [
    ['2 pages', 'count'],
    ['a 5-page site', 'count'],
    ['3 revisions', 'count'],
    ['2 more revisions', 'count'],
    ['2 or 3 rounds', 'count'],
    ['3 days', 'count'],
    ['3-4 days', 'count'],
    ['2 hafte mein', 'count'],
    ['10 hours of work', 'count'],
    ['1 lakh users', 'count'],
    ['18% GST', 'percent'],
    ['50 percent advance', 'percent'],
    ['at 5:30 pm', 'time'],
    ['5 baje', 'time'],
    ['by 15th', 'date'],
    ['15 Nov', 'date'],
    ['12/11/2026', 'date'],
    ['call 9876543210', 'phone'],
    ['+91 98765 43210', 'phone'],
    ['since 2019', 'year'],
    ['card c001', 'code'],
    ['v2 of the site', 'code'],
  ];
  it.each(table)('%s → ignored as %s, no price', (text, reason) => {
    const r = readAmount(text);
    expect(r.rupees).toBeNull();
    expect(r.ambiguous).toBe(false);
    expect(r.ignored.map((x) => x.reason)).toContain(reason);
  });
  it('the price survives next to non-prices', () => {
    expect(read('2 pages, 3 revisions, 18% GST extra, 25k total')).toMatchObject({
      rupees: 25000n,
      unit: 'fixed',
    });
    expect(read('Delivery by 15th Nov for 25k')).toMatchObject({
      rupees: 25000n,
      ambiguous: false,
    });
    expect(read('5-page site for 20k in 3 days')).toMatchObject({
      rupees: 20000n,
      ambiguous: false,
    });
  });
});

describe('whose number: price, reference or rejected (GUIDELINES §4 rule 1)', () => {
  const table: [string, bigint | null][] = [
    ['You quoted 45k, we can do 32k', 32000n],
    ['Your quote of ₹45,000 is high. 38k?', 38000n],
    ['Aapne 45k bola tha, hum 35k denge', 35000n],
    ['Aap 45k maang rahe ho, 40k chalega?', 40000n],
    ["Can't do 45k but 40k ok", 40000n],
    ['45k nahi, 38k final', 38000n],
    ['45k is too much', null],
    ['45k bahut zyada hai', null],
    ['Not more than 40k', 40000n],
    ["We can't go above 40k", 40000n],
    ['40k se zyada nahi', 40000n],
    ['40k max', 40000n],
    ['you quoted 45k', null],
  ];
  it.each(table)('%s → %s', (text, rupees) => {
    const r = readAmount(text);
    expect(r.rupees).toBe(rupees);
    expect(r.ambiguous).toBe(false);
  });
  it('keeps the references as candidates', () => {
    expect(
      findAmounts('You quoted 45k, we can do 32k').candidates.map((c) => [c.rupees, c.role]),
    ).toEqual([
      [45000n, 'reference'],
      [32000n, 'price'],
    ]);
  });
});

describe('fails closed: ambiguous rather than a guess', () => {
  const table: [string, string, bigint | null][] = [
    ['₹45,000.50', 'paise', 45000n],
    ['4,5,000', 'bad_grouping', 45000n],
    ['$500 per hour', 'not_inr', null],
    ['500 dollars', 'not_inr', null],
    ['30-ish', 'approximate', null],
    ['~45k', 'approximate', 45000n],
    ['45k odd', 'approximate', 45000n],
    ['1.234567L', 'inexact', null],
    ['Agar 15 tak de do toh 40 kar denge', 'bare_small', null],
    ['40k or 45k, whichever', 'competing', 40000n],
    ['Budget 40000, can stretch to 45k', 'competing', 40000n],
    ['50-40k', 'range_order', 50000n],
  ];
  it.each(table)('%s → %s', (text, flag, rupees) => {
    const r = readAmount(text);
    expect(r.ambiguous).toBe(true);
    expect(r.flags).toContain(flag);
    expect(r.rupees).toBe(rupees);
  });
  it('the same price twice is not competing', () => {
    expect(read('45k, i.e. ₹45,000')).toMatchObject({ rupees: 45000n, ambiguous: false });
  });
  it('hedges are noted but not ambiguous', () => {
    const r = readAmount('around 45k');
    expect([r.rupees, r.ambiguous, r.candidates[0]!.hedged]).toEqual([45000n, false, true]);
  });
});

describe('adversarial input', () => {
  it('lone number words and Hindi homographs are not amounts', () => {
    for (const s of [
      'de do',
      'ek baar aur',
      'saath mein karte hain',
      'one more revision',
      'bara project hai',
      'teen',
    ])
      expect(readAmount(s).candidates, s).toEqual([]);
  });
  it('returns spans that index the original text', () => {
    const text = 'Theek hai, Rs. 45,000/- final.';
    const r = readAmount(text);
    expect(r.span).toEqual({ start: 11, end: 23, text: 'Rs. 45,000/-' });
    expect(text.slice(r.span!.start, r.span!.end)).toBe(r.span!.text);
  });
  it('never throws on odd input', () => {
    for (const s of [
      '',
      ' ',
      '₹',
      'k',
      'L',
      '-',
      '45-',
      '-45k',
      ',,,',
      '1,',
      '.5L',
      '9'.repeat(400),
      '₹₹₹45k',
      '🙏 45k 🙏',
    ])
      expect(() => readAmount(s)).not.toThrow();
  });
  it('Hindi spellings normalise without collisions', () => {
    expect(normaliseWord('paanch')).toBe('panch');
    expect(hindiNumeral('paintalis')).toBe(45n);
    expect(hindiNumeral('chhattis')).toBe(36n);
    expect(hindiNumeral('chattis')).toBe(36n);
    expect(hindiNumeral('saat')).toBe(7n);
    expect(hindiNumeral('saath')).toBe(60n);
    expect(hindiNumeral('teen')).toBe(3n);
  });
  it('is deterministic', () => {
    const s = 'You quoted 45k, we can do 32k by 15th, 2 revisions';
    expect(
      JSON.stringify(readAmount(s), (_k, v: unknown) => (typeof v === 'bigint' ? `${v}n` : v)),
    ).toBe(
      JSON.stringify(readAmount(s), (_k, v: unknown) => (typeof v === 'bigint' ? `${v}n` : v)),
    );
  });
});

describe('property: format a random integer, parse it back to the same integer', () => {
  const formats = AMOUNT_FORMATS.filter((f) => f !== 'none');
  const templates = [
    (x: string) => x,
    (x: string) => `Can you do ${x}?`,
    (x: string) => `Budget ${x} hai.`,
    (x: string) => `${x} chalega`,
  ];
  it.each(formats)('%s', (format) => {
    fc.assert(
      fc.property(
        fc.bigInt({ min: 1n, max: 100_000_000n }),
        fc.constantFrom(...HAZAAR_SPELLINGS),
        fc.constantFrom(...templates),
        (n, spelling, tpl) => {
          const rupees = format === 'hazaar' ? n * 1000n : n;
          const text = tpl(formatAmount(rupees, format, spelling));
          const r = readAmount(text);
          expect(r.rupees, text).toBe(rupees);
          expect(r.ambiguous, text).toBe(false);
          if (format === 'per_hour') expect(r.unit, text).toBe('hour');
        },
      ),
      { seed: 42, numRuns: 500 },
    );
  });
});
