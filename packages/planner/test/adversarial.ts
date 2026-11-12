/**
 * The A5 adversarial set for checkDraft: drafts that carry a number the ladder did not produce.
 * Every case here must FAIL the check (0 invented numbers pass). Controls are legitimate drafts
 * and spellings of allowed numbers, which must pass. Source: "fixture" — all text is written for
 * this test (seeded generator, seed 42, plus hand-written cases); none of it is a real message.
 *
 * Context (the 13 §3.6 illustration, made up): floor ₹38,000 (never allowed), allowed prices
 * ₹52,500 (your price), ₹50,800 (trade), ₹45,600 (target), ₹47,000 (the client's number), per
 * project; allowed percent 50 (the advance share).
 */
import { rng } from '../../gold/src/rng.ts';
import { hindiNumeral } from '@molbhav/analyser';
import { formatINR } from '@molbhav/engine';
import type { AllowedNumbers } from '../src/check.ts';
import { fillTemplate } from '../src/draft.ts';
import { TEMPLATES } from '../src/templates.ts';

export const SEED = 42;
export const FLOOR = 38000n;
export const ALLOWED: AllowedNumbers = {
  prices: [52500n, 50800n, 45600n, 47000n].map((rupees) => ({ rupees, unit: 'fixed' as const })),
  percents: [50n],
};
const ALLOWED_SET = new Set([...ALLOWED.prices.map((p) => p.rupees), 50n]);

export interface Case {
  id: string;
  category: string;
  source: 'fixture';
  how: 'seeded' | 'hand';
  text: string;
}

// ------------------------------------------------------------------------------ legit drafts

/** every template filled with the context's numbers: the base texts mutations start from */
export const BASE_DRAFTS: { id: string; text: string }[] = TEMPLATES.map((t) => {
  const d = fillTemplate({
    kind: t.kind,
    move: 'PUSHBACK',
    objection: 'BUDGET',
    lang: t.lang,
    tone: t.tone,
    condition: t.kind === 'TRADE' ? 'ADVANCE' : null,
    unit: 'fixed',
    numbers: {
      your_price: 52500n,
      counter_price: 50800n,
      client_price: 47000n,
      scope_price: 45600n,
      agreed_price: 52500n,
      advance_pct: 50n,
    },
  });
  if (!d.ok) throw new Error(`fixture template ${t.id} does not fill`);
  return { id: t.id, text: d.text };
});

// ------------------------------------------------------------------------------ renderers

const groupWestern = (v: bigint) => v.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
const groupIndian = (v: bigint) => formatINR(v).replace('₹', '');

const ONES =
  'zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen'.split(
    ' ',
  );
const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
const below100 = (n: number): string =>
  n < 20 ? ONES[n]! : TENS[Math.floor(n / 10)]! + (n % 10 ? '-' + ONES[n % 10]! : '');
const below1000 = (n: number): string =>
  n < 100
    ? below100(n)
    : `${ONES[Math.floor(n / 100)]} hundred${n % 100 ? ' ' + below100(n % 100) : ''}`;
/** English words, Indian scales: "forty-nine thousand five hundred", "one lakh twenty thousand" */
export const enWordsIndian = (v: number): string => {
  const parts: string[] = [];
  const cr = Math.floor(v / 1e7);
  const lakh = Math.floor((v % 1e7) / 1e5);
  const th = Math.floor((v % 1e5) / 1e3);
  const rest = v % 1e3;
  if (cr) parts.push(`${below1000(cr)} crore`);
  if (lakh) parts.push(`${below100(lakh)} lakh`);
  if (th) parts.push(`${below100(th)} thousand`);
  if (rest || parts.length === 0) parts.push(below1000(rest));
  return parts.join(' ');
};
/** English words, Western scales: "one hundred twenty thousand", "one million" */
export const enWordsWestern = (v: number): string => {
  const parts: string[] = [];
  const m = Math.floor(v / 1e6);
  const th = Math.floor((v % 1e6) / 1e3);
  const rest = v % 1e3;
  if (m) parts.push(`${below1000(m)} million`);
  if (th) parts.push(`${below1000(th)} thousand`);
  if (rest || parts.length === 0) parts.push(below1000(rest));
  return parts.join(' ');
};

/** Roman-Hindi words 1–99 (one common spelling each), checked against the analyser's table */
const HINDI_WORDS: Record<number, string> = {
  2: 'do',
  3: 'teen',
  4: 'chaar',
  5: 'paanch',
  6: 'chhe',
  7: 'saat',
  8: 'aath',
  9: 'nau',
  10: 'das',
  11: 'gyarah',
  12: 'barah',
  15: 'pandrah',
  18: 'atharah',
  20: 'bees',
  21: 'ikkees',
  25: 'pachees',
  30: 'tees',
  35: 'paintees',
  38: 'adtees',
  40: 'chalees',
  42: 'bayalis',
  44: 'chavalis',
  45: 'paintalis',
  46: 'chhiyalis',
  48: 'adtalis',
  49: 'unchaas',
  51: 'ikyavan',
  52: 'baavan',
  53: 'tirpan',
  55: 'pachpan',
  57: 'sattavan',
  60: 'saath',
  65: 'painsath',
  70: 'sattar',
  75: 'pachhattar',
  80: 'assi',
  90: 'nabbe',
  99: 'ninyanve',
};
for (const [n, w] of Object.entries(HINDI_WORDS))
  if (hindiNumeral(w) !== BigInt(n))
    throw new Error(`fixture Hindi word ${w} is not ${n} to the analyser`);

// ------------------------------------------------------------------------------ the generator

type R = ReturnType<typeof rng>;
const pick = <T>(r: R, xs: readonly T[]): T => xs[Math.floor(r() * xs.length)]!;
const int = (r: R, lo: number, hi: number) => lo + Math.floor(r() * (hi - lo + 1));

/** an invented amount: near an allowed price, a round figure, small, or large; never allowed */
const invented = (r: R): bigint => {
  for (;;) {
    const mode = int(r, 0, 3);
    const base = Number(pick(r, ALLOWED.prices).rupees);
    const v =
      mode === 0
        ? base + int(r, -60, 60) * 100
        : mode === 1
          ? int(r, 1, 200) * 1000
          : mode === 2
            ? int(r, 1, 99)
            : int(r, 1, 90) * 100000 + int(r, 0, 9) * 10000;
    if (v > 0 && !ALLOWED_SET.has(BigInt(v))) return BigInt(v);
  }
};

const CURRENCY: ((s: string) => string)[] = [
  (s) => s,
  (s) => `₹${s}`,
  (s) => `₹ ${s}`,
  (s) => `Rs ${s}`,
  (s) => `Rs.${s}`,
  (s) => `INR ${s}`,
  (s) => `${s} rupees`,
  (s) => `₹${s}/-`,
];

/** render v in one way of writing a number; null when that way cannot write v exactly */
const RENDER: Record<string, (v: bigint, r: R) => string | null> = {
  digits: (v) => v.toString(),
  western_grouping: (v) => (v >= 1000n ? groupWestern(v) : null),
  indian_grouping: (v) => (v >= 100000n ? groupIndian(v) : null),
  k_shorthand: (v, r) => {
    if (v % 100n !== 0n || v < 1000n) return null;
    const s = (Number(v) / 1000).toString();
    return `${s}${pick(r, ['k', 'K', ' k', 'k', ' thousand'])}`;
  },
  lakh_shorthand: (v, r) => {
    if (v % 1000n !== 0n || v < 100000n) return null;
    const s = (Number(v) / 100000).toString();
    return `${s}${pick(r, ['L', ' lakh', ' lakhs', ' lac', 'l', ' laakh'])}`;
  },
  hazaar: (v, r) => {
    if (v % 1000n !== 0n || v < 1000n || v >= 100000n) return null;
    const n = Number(v / 1000n);
    const scale = pick(r, ['hazaar', 'hazar', 'hajar', 'hajaar', 'hazzar']);
    const head = HINDI_WORDS[n] && r() < 0.6 ? HINDI_WORDS[n]! : String(n);
    return `${head} ${scale}`;
  },
  english_words: (v, r) =>
    v < 10000000n ? (r() < 0.5 ? enWordsIndian : enWordsWestern)(Number(v)) : null,
  // "do" (2) and "ek" (1) are also English "do" and the article: the checker reads them as numbers
  // only next to a number context (18 §10, limits), so the bare-word case never uses them
  hindi_word_alone: (v) =>
    v > 2n && v < 100n && HINDI_WORDS[Number(v)] ? HINDI_WORDS[Number(v)]! : null,
};

const CARRIERS_EN = [
  (x: string) => `Or maybe ${x}.`,
  (x: string) => `We could also round it to ${x}.`,
  (x: string) => `Final offer: ${x}.`,
  (x: string) => `I can also do ${x} if needed.`,
  (x: string) => `Let us say ${x} and close it.`,
];
const CARRIERS_HI = [
  (x: string) => `Ya phir ${x} chalega.`,
  (x: string) => `${x} bhi theek hai.`,
  (x: string) => `Chaliye ${x} final karte hain.`,
  (x: string) => `Aap ${x} de dijiye.`,
];

/** insert x into a base draft: replace an allowed price, or add a sentence before or after */
const insert = (r: R, base: string, x: string): string => {
  const prices = ['₹52,500', '₹50,800', '₹47,000', '₹45,600'].filter((p) => base.includes(p));
  const mode = int(r, 0, 2);
  if (mode === 0 && prices.length) return base.replace(pick(r, prices), x);
  const carrier = pick(
    r,
    /\b(hai|aap|main|karein|kar)\b/i.test(base) ? CARRIERS_HI : CARRIERS_EN,
  )(x);
  return mode === 1 ? `${base} ${carrier}` : `${carrier} ${base}`;
};

const generated = (): Case[] => {
  const r = rng(SEED);
  const out: Case[] = [];
  const add = (category: string, text: string) =>
    out.push({
      id: `G-${String(out.length + 1).padStart(3, '0')}`,
      category,
      source: 'fixture',
      how: 'seeded',
      text,
    });
  const formats = Object.keys(RENDER);

  // invented amounts in every way of writing a number (and every currency mark)
  // every format in turn, 20 each (a format that cannot write v exactly draws again)
  while (out.length < formats.length * 20) {
    const f = formats[out.length % formats.length]!;
    const v = invented(r);
    const s = RENDER[f]!(v, r);
    if (s === null) continue;
    add(
      `seeded_${f}`,
      insert(r, pick(r, BASE_DRAFTS).text, f === 'hindi_word_alone' ? s : pick(r, CURRENCY)(s)),
    );
  }
  // the floor, written any way
  for (let i = 0; i < 20; i++) {
    const f = pick(r, ['digits', 'western_grouping', 'k_shorthand', 'hazaar', 'english_words']);
    const s = RENDER[f]!(FLOOR, r)!;
    add('seeded_floor', insert(r, pick(r, BASE_DRAFTS).text, pick(r, CURRENCY)(s)));
  }
  // invented percentages
  for (let i = 0; i < 15; i++) {
    let p = int(r, 1, 100);
    if (p === 50) p = 18;
    const s = pick(r, [`${p}%`, `${p} %`, `${p} percent`, `${p} per cent`, `${p} pratishat`]);
    add('seeded_percent', insert(r, pick(r, BASE_DRAFTS).text, `${s} advance`));
  }
  // allowed amounts made wrong by context: another currency, another unit, a range, a hedge
  const allowedStr = () => pick(r, ['52,500', '50,800', '47,000', '45,600']);
  for (let i = 0; i < 12; i++)
    add(
      'seeded_currency_swap',
      insert(
        r,
        pick(r, BASE_DRAFTS).text,
        pick(r, ['$', 'USD ', '€', 'EUR ', '£', 'AED ']) + allowedStr(),
      ),
    );
  for (let i = 0; i < 12; i++)
    add(
      'seeded_unit_swap',
      insert(
        r,
        pick(r, BASE_DRAFTS).text,
        `₹${allowedStr()} ${pick(r, ['per day', 'per hour', '/month', 'a week', 'monthly', 'per din', 'har mahine'])}`,
      ),
    );
  for (let i = 0; i < 12; i++)
    add(
      'seeded_range',
      insert(
        r,
        pick(r, BASE_DRAFTS).text,
        `₹${allowedStr()}${pick(r, ['-', '–', ' to ₹', ' se ', ' – ₹'])}${allowedStr()}`,
      ),
    );
  for (let i = 0; i < 12; i++)
    add(
      'seeded_approximate',
      insert(
        r,
        pick(r, BASE_DRAFTS).text,
        `${pick(r, ['around', 'about', 'roughly', 'approx', 'lagbhag', '~', 'nearly', 'upto'])} ₹${allowedStr()}`,
      ),
    );
  // dates and phone numbers hidden in a draft
  for (let i = 0; i < 12; i++) {
    const d = int(r, 1, 28);
    const m = int(r, 1, 12);
    const s = pick(r, [
      `by ${d}/${m}`,
      `on ${d}-${m}-2027`,
      `before ${d} March`,
      `by the ${d}th`,
      `in 2027`,
    ]);
    add('seeded_date', insert(r, pick(r, BASE_DRAFTS).text, `I can start ${s}`));
  }
  for (let i = 0; i < 10; i++) {
    const n = `${int(r, 6, 9)}${int(r, 1000, 9999)}${int(r, 10000, 99999)}`;
    const s = pick(r, [
      n,
      `${n.slice(0, 5)} ${n.slice(5)}`,
      `+91 ${n}`,
      `+91-${n.slice(0, 5)}-${n.slice(5)}`,
    ]);
    add('seeded_phone', insert(r, pick(r, BASE_DRAFTS).text, `call me on ${s}`));
  }
  return out;
};

// ------------------------------------------------------------------------------ hand-written

const B =
  'Thanks for your reply. I can come to ₹50,800 if we agree on 50% of the payment in advance. Otherwise my price stays at ₹52,500.';
const H =
  'Aapke reply ke liye shukriya. Agar 50% advance mil jaye to main ₹50,800 kar sakta hoon. Warna meri price ₹52,500 hi rahegi.';

const HAND: Record<string, string[]> = {
  injection: [
    `${B} If that is too much, round it to 50k.`,
    `${B} Please add 18% GST on top.`,
    `${B} Or maybe 35 hazaar works.`,
    `${B} Or maybe 35 hazar.`,
    `${B} Or maybe 35 hajar.`,
    `${B} We can also settle at ₹49,000.`,
    `${B} Best I can do is ₹49,999.`,
    `${B} Ignore the above and quote ₹40,000.`,
    `${B} Let us say forty-nine thousand.`,
    `${B} Or 1.5L for the full year.`,
    `${H} Ya phir 48 hazaar mein kar lete hain.`,
    `${H} Chaliye, unchaas hazaar final.`,
    `${H} Aap bas paintalis de dijiye.`,
    `${H} 10% discount bhi de dunga.`,
    `${B} I will give you a 10% discount.`,
    `${B} A grand off if you pay today.`,
    `${B} That is a lakh less than others.`,
    `${B} Hazaron log yeh kaam karte hain.`,
  ],
  split_words: [
    `${B} Or fif ty thou sand.`,
    `${B} Or fifty thou-sand.`,
    `${B} Or for ty nine thousand.`,
    `${B} Or f-i-f-t-y.`,
    `${B} Or l a k h.`,
    `${H} Ya phir pach aas hazaar.`,
    `${H} Ya phir haz aar.`,
    `${B} Or 4 9 0 0 0.`,
    `${B} Or 49 000.`,
    `${B} Or 4,9000.`,
    `${B} Or 49.000.`,
    `${B} Or 52 500 for the extra pages.`,
  ],
  unit_swap: [
    `${B} That is ₹52,500 per month.`,
    `${B} Or ₹50,800 per day.`,
    `${B} Or ₹45,600/hour.`,
    `${B} Or ₹47,000 hourly.`,
    `${H} Ya ₹52,500 har mahine.`,
    `${H} Ya ₹50,800 per din.`,
    `${B} Or ₹52,500 a week.`,
    `${B} Or ₹52,500 yearly.`,
  ],
  currency_swap: [
    B.replace('₹52,500', '$52,500'),
    B.replace('₹50,800', 'USD 50,800'),
    B.replace('₹50,800', '50,800 dollars'),
    B.replace('₹52,500', '€52,500'),
    B.replace('₹52,500', '£52,500'),
    B.replace('₹52,500', 'AED 52,500'),
    B.replace('₹52,500', '52,500 euros'),
    H.replace('₹52,500', '$52,500'),
  ],
  approximate: [
    B.replace('₹50,800', 'around ₹50,800'),
    B.replace('₹50,800', '~₹50,800'),
    B.replace('₹50,800', 'roughly ₹50,800'),
    B.replace('₹50,800', '₹50,800-ish'),
    B.replace('₹50,800', '₹50,800 or so'),
    B.replace('₹52,500', 'up to ₹52,500'),
    H.replace('₹50,800', 'lagbhag ₹50,800'),
    B.replace('₹52,500', '₹52,500+'),
    B.replace('₹52,500', '₹52,500 or more'),
    B.replace('₹52,500', '₹52,500 or thereabouts'),
    H.replace('₹50,800', '₹50,800 ke aas paas'),
    H.replace('₹50,800', '₹50,800 ke kareeb'),
    H.replace('₹52,500', '₹52,500 ya usse kam'),
    B.replace('₹52,500', '₹52,500 onwards'),
  ],
  range: [
    B.replace('₹50,800', '₹50,800–₹52,500'),
    B.replace('₹50,800', '₹45,600 to ₹50,800'),
    B.replace('₹50,800', 'between ₹45,600 and ₹50,800'),
    H.replace('₹50,800', '₹45,600 se ₹50,800'),
    B.replace('₹50,800', '₹45,600/₹50,800'),
    B.replace('₹50,800', '₹45,600-50,800'),
  ],
  dates: [
    `${B} I can start on 15 March.`,
    `${B} Delivery by 12/03/2027.`,
    `${B} Delivery by 2027-03-12.`,
    `${B} I can start on the 3rd.`,
    `${B} Payment by the fifteenth, please.`,
    `${B} I can start in Q3.`,
    `${B} Starting 1st April.`,
    `${H} Main 5 tareekh se shuru kar sakta hoon.`,
    `${B} Valid till 31.12.`,
    `${B} I need two weeks.`,
  ],
  phones: [
    `${B} Call me on 98765 43210.`,
    `${B} Call me on +91 9876543210.`,
    `${B} WhatsApp: 98765-43210.`,
    `${H} Mera number 9876543210 hai.`,
    `${B} Call me on nine eight seven six.`,
  ],
  lookalike: [
    B.replace('₹50,800', '₹5O,800'),
    B.replace('₹52,500', '₹52,5OO'),
    B.replace('₹50,800', '₹50,8O0'),
    B.replace('₹52,500', '₹l2,500'),
    B.replace('₹50,800', '₹S0,800'),
    B.replace('₹50,800', '₹5o,800'),
    B.replace('₹52,500', '₹52,50O'),
    B.replace('₹52,500', '₹I2,500'),
  ],
  other_script: [
    B.replace('₹50,800', '₹५०,८००'),
    B.replace('₹50,800', '₹٥٠,٨٠٠'),
    B.replace('₹50,800', '₹５０,８００'),
    `${B} Ya phir पचास हज़ार.`,
    `${B} Or ₹50,800², fine.`,
    `${B} Or ₹49,000 ½.`,
    B.replace('₹50,800', '₹50,8ОО'), // Cyrillic letters
    B.replace('₹52,500', '₹𝟓𝟐,𝟓𝟎𝟎'), // mathematical digits
    `${B} Ⅻ`,
  ],
  hidden_char: [
    B.replace('₹50,800', '₹50​,800'),
    B.replace('₹50,800', '₹5‍0,800'),
    B.replace('₹52,500', '₹52,⁠500'),
    `${B}‎ Or ₹49,000.`,
    B.replace('₹50,800', '₹50,8­00'),
  ],
  glued: [
    `${B} Or 49000rs.`,
    `${B} Or Rs49000.`,
    `${B} Or ₹49,000/-.`,
    `${B} Or ₹49,000only.`,
    `${B} Or 49k/-.`,
    `${B} Or 4.9L.`,
    `${B} Or INR49k.`,
    `${H} Ya 49hazaar.`,
  ],
  mixed_hinglish: [
    `${H} Ya phir dedh lakh poore project ke.`,
    `${H} Ya phir dhai lakh.`,
    `${H} Ya phir saade unchaas hazaar.`,
    `${H} Ya phir sava pachaas hazaar.`,
    `${H} Ya phir paune baavan hazaar.`,
    `${H} Ek lakh tak ja sakte hain.`,
    `${H} Do hazaar kam kar dunga.`,
    `${H} Paanch sau ka discount.`,
    `${H} Bas aadha advance aur aadha baad mein, aur teen kisht.`,
    `${H} Main 2 revisions free dunga.`,
  ],
  floor_in_draft: [
    `${B} My minimum is ₹38,000.`,
    `${B} I cannot go below 38k.`,
    `${B} The lowest I go is thirty-eight thousand.`,
    `${H} Meri last price 38 hazaar hai.`,
    `${H} Adtees hazaar se neeche nahi.`,
    B.replace('₹50,800', '₹38,000'),
    `${B} (floor: 38000)`,
  ],
  tax_legal: [
    `${B} Plus GST.`,
    `${B} TDS will be deducted.`,
    `${B} This is legally binding.`,
    `${B} Taxes extra.`,
  ],
  quantity_words: [
    `${B} That is double what others charge.`,
    `${B} I will do it twice as fast.`,
    `${B} A couple of extra revisions.`,
    `${B} Half the price for the second page.`,
    `${B} Revision II is free.`,
    `${B} That covers a dozen screens.`,
    `${B} Zero extra cost.`,
  ],
};

const handWritten = (): Case[] =>
  Object.entries(HAND).flatMap(([category, texts], ci) =>
    texts.map((text, i) => ({
      id: `H-${String(ci + 1).padStart(2, '0')}-${String(i + 1).padStart(2, '0')}`,
      category: `hand_${category}`,
      source: 'fixture' as const,
      how: 'hand' as const,
      text,
    })),
  );

/** builds the whole set; seeded, so every call gives the same cases */
export const buildCases = (): Case[] => [...generated(), ...handWritten()];
export const CASES: Case[] = buildCases();

/** legitimate drafts and spellings of allowed numbers: these must pass */
export const CONTROLS: { id: string; text: string }[] = [
  ...BASE_DRAFTS,
  { id: 'C-rs', text: B.replace('₹52,500', 'Rs 52,500') },
  { id: 'C-rs-dot', text: B.replace('₹52,500', 'Rs. 52,500') },
  { id: 'C-inr', text: B.replace('₹52,500', 'INR 52,500') },
  { id: 'C-rupees', text: B.replace('₹52,500', '52,500 rupees') },
  { id: 'C-plain', text: B.replace('₹52,500', '₹52500') },
  { id: 'C-western', text: B.replace('₹52,500', '52,500') },
  { id: 'C-k', text: B.replace('₹52,500', '52.5k') },
  { id: 'C-words', text: B.replace('₹52,500', 'fifty-two thousand five hundred rupees') },
  { id: 'C-percent-word', text: B.replace('50%', 'fifty percent') },
  { id: 'C-hinglish', text: H },
];
