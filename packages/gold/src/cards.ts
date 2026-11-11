/**
 * Seeded prompt-card generator (docs/product/04_research_integrity.md §2 step 2).
 * scenario × intended move × objection × language × amount format, seed 42.
 *
 * A card is a writing prompt for the author, never a message: it says which move, objection,
 * language and amount format to write, and in which deal situation. The author writes the
 * message in their own words with the writing tool.
 *
 * Stratification: exactly 50 cards per learned class (300 in all), so a stratified 20% test
 * split holds 10 per class if the blind labels follow the intended moves. Within each class,
 * every attribute has an exact quota (largest remainder), shuffled independently with the seed.
 */
import { MOVES, type Language, type Move, type Unit } from '@molbhav/analyser';
import {
  formatAmount,
  HAZAAR_SPELLINGS,
  type AmountFormat,
  type HazaarSpelling,
} from '@molbhav/analyser/format';
import { OBJECTION_VALUES } from './schema.ts';
import { rng, shuffle } from './rng.ts';

export { rng, shuffle };

export const SEED = 42;
export const PER_CLASS = 50;

/** Expand {value: count} into a list of exactly `total` values (counts must sum to total). */
export const quota = <T extends string>(counts: Partial<Record<T, number>>, total: number): T[] => {
  const out: T[] = [];
  for (const [k, n] of Object.entries(counts) as [T, number][])
    for (let i = 0; i < n; i++) out.push(k);
  if (out.length !== total) throw new Error(`quota sums to ${out.length}, expected ${total}`);
  return out;
};

type Scale = 'thousands' | 'lakhs' | 'monthly' | 'hourly';
export interface Scenario {
  id: string;
  /** what the freelancer is pricing: a writing prompt, not a message */
  work: string;
  scale: Scale;
  /** the freelancer's quote, whole rupees (per hour / per month for those scales) */
  quote: bigint;
}

/** Ten self-written situations for D1's first user (web/app developers and designers). */
export const SCENARIOS: readonly Scenario[] = [
  { id: 's01', work: 'a 5-page website for a home bakery', scale: 'thousands', quote: 45000n },
  { id: 's02', work: 'a landing page for a coaching class', scale: 'thousands', quote: 18000n },
  { id: 's03', work: 'a logo and brand kit for a café', scale: 'thousands', quote: 25000n },
  { id: 's04', work: 'a Shopify store for a clothing label', scale: 'thousands', quote: 60000n },
  { id: 's05', work: 'a UI redesign of an inventory dashboard', scale: 'lakhs', quote: 160000n },
  { id: 's06', work: 'an Android app MVP for a gym', scale: 'lakhs', quote: 250000n },
  { id: 's07', work: 'a Figma prototype for a fintech startup', scale: 'lakhs', quote: 120000n },
  { id: 's08', work: 'monthly website maintenance', scale: 'monthly', quote: 15000n },
  { id: 's09', work: 'hourly bug-fixing on a React app', scale: 'hourly', quote: 1200n },
  { id: 's10', work: 'hourly UI consulting calls', scale: 'hourly', quote: 2000n },
];

const COMPATIBLE: Record<Exclude<AmountFormat, 'none'>, Scale[]> = {
  rupee_comma: ['thousands', 'lakhs', 'monthly'],
  k: ['thousands', 'monthly'],
  hazaar: ['thousands', 'monthly'],
  lakh: ['lakhs'],
  per_hour: ['hourly'],
};

type Obj = (typeof OBJECTION_VALUES)[number];
type Fmt = AmountFormat;

/** Per-class quotas (each sums to 50). [HYPOTHESIS: a plausible spread, not observed data.] */
const OBJECTION_QUOTA: Record<Move, Partial<Record<Obj, number>>> = {
  PRICE_POSITION: {
    BUDGET: 14,
    COMPETITOR: 8,
    SCOPE: 6,
    TIMELINE: 4,
    PAYMENT_TERMS: 4,
    TRUST: 2,
    NONE: 12,
  },
  PUSHBACK: { BUDGET: 10, COMPETITOR: 9, SCOPE: 9, TIMELINE: 8, PAYMENT_TERMS: 7, TRUST: 7 },
  CONCESSION: {
    TIMELINE: 10,
    PAYMENT_TERMS: 10,
    SCOPE: 10,
    BUDGET: 6,
    TRUST: 2,
    COMPETITOR: 2,
    NONE: 10,
  },
  INFO_REQUEST: { SCOPE: 10, TIMELINE: 10, PAYMENT_TERMS: 8, TRUST: 10, BUDGET: 2, NONE: 10 },
  ACCEPT: { PAYMENT_TERMS: 8, TIMELINE: 6, NONE: 36 },
  OTHER: { TRUST: 4, BUDGET: 2, NONE: 44 },
};

const FORMAT_QUOTA: Record<Move, Partial<Record<Fmt, number>>> = {
  PRICE_POSITION: { none: 8, rupee_comma: 9, k: 9, hazaar: 9, lakh: 8, per_hour: 7 },
  CONCESSION: { none: 20, rupee_comma: 6, k: 6, hazaar: 6, lakh: 6, per_hour: 6 },
  PUSHBACK: { none: 38, rupee_comma: 3, k: 3, hazaar: 2, lakh: 2, per_hour: 2 },
  INFO_REQUEST: { none: 45, rupee_comma: 1, k: 1, hazaar: 1, lakh: 1, per_hour: 1 },
  ACCEPT: { none: 30, rupee_comma: 4, k: 4, hazaar: 4, lakh: 4, per_hour: 4 },
  OTHER: { none: 50 },
};

/** Where the amount comes from in the message (PUSHBACK / INFO_REQUEST only mention the quote). */
export type AmountRole = 'client_price' | 'quote_reference';
const ROLE: Record<Move, AmountRole> = {
  PRICE_POSITION: 'client_price',
  CONCESSION: 'client_price',
  ACCEPT: 'client_price',
  PUSHBACK: 'quote_reference',
  INFO_REQUEST: 'quote_reference',
  OTHER: 'quote_reference',
};

/** Client price as a share of the quote, in per-mille, per class. [HYPOTHESIS] */
const PRICE_PERMILLE: Record<Move, readonly number[]> = {
  PRICE_POSITION: [600, 650, 700, 750, 800, 850],
  CONCESSION: [820, 850, 880, 900, 920, 950],
  ACCEPT: [1000],
  PUSHBACK: [1000],
  INFO_REQUEST: [1000],
  OTHER: [1000],
};
const ROUND: Record<Scale, bigint> = {
  thousands: 1000n,
  monthly: 1000n,
  lakhs: 5000n,
  hourly: 50n,
};

export type QuoteUnit = 'fixed' | 'hour' | 'month';

export interface Card {
  card_id: string;
  scenario_id: string;
  work: string;
  /** has the freelancer already sent their quote? decides ANCHOR vs COUNTER (GUIDELINES §5.1) */
  quote_sent: boolean;
  /** the freelancer's quote, as the card shows it */
  quote_text: string;
  /** the same quote as whole rupees (digits); the scenario's quote, whether or not it is sent */
  quote_rupees: string;
  /** what the quote is per: a fixed price, per hour or per month */
  quote_unit: QuoteUnit;
  intended_move: Move;
  objection: Obj;
  language: Language;
  amount_format: AmountFormat;
  hazaar_spelling: HazaarSpelling | null;
  amount_role: AmountRole | null;
  /** whole rupees as digits, or null for format "none" */
  amount_rupees: string | null;
  amount_high_rupees: string | null;
  amount_unit: Unit | null;
  /** how the card shows the amount: the format the author should use */
  amount_text: string | null;
  /** CONCESSION only: should the concession ask for something in return? */
  conditional: boolean | null;
  /** about 15% of cards ask for a deliberately ambiguous message (04 §2 step 3) */
  ambiguous: boolean;
}

const unitOf = (s: Scale): QuoteUnit =>
  s === 'hourly' ? 'hour' : s === 'monthly' ? 'month' : 'fixed';
const quoteText = (sc: Scenario) =>
  sc.scale === 'hourly'
    ? formatAmount(sc.quote, 'per_hour')
    : sc.scale === 'monthly'
      ? `${formatAmount(sc.quote, 'rupee_comma')} per month`
      : formatAmount(sc.quote, 'rupee_comma');
const roundTo = (x: bigint, step: bigint) => ((x + step / 2n) / step) * step;

/** Ambiguous cards per class: 8, 8, 8, 7, 7, 7 = 45 of 300 (15%). */
const AMBIGUOUS = [8, 8, 8, 7, 7, 7] as const;

export const generateCards = (seed = SEED): Card[] => {
  const r = rng(seed);
  const cards: Omit<Card, 'card_id'>[] = [];
  MOVES.forEach((move, mi) => {
    const objections = shuffle(quota(OBJECTION_QUOTA[move], PER_CLASS), r);
    const formats = shuffle(quota(FORMAT_QUOTA[move], PER_CLASS), r);
    const languages = shuffle(quota<Language>({ en: 25, hinglish: 25 }, PER_CLASS), r);
    // ACCEPT needs a quote to accept (GUIDELINES J7), so every ACCEPT card has one. A quota
    // change does not move the seeded stream: shuffle draws the same numbers whatever the values.
    const quoteSent = shuffle(
      quota<'y' | 'n'>(
        move === 'PRICE_POSITION'
          ? { y: 25, n: 25 }
          : move === 'ACCEPT'
            ? { y: 50, n: 0 }
            : { y: 35, n: 15 },
        PER_CLASS,
      ),
      r,
    );
    const amb = AMBIGUOUS[mi]!;
    const ambiguous = shuffle(quota<'y' | 'n'>({ y: amb, n: PER_CLASS - amb }, PER_CLASS), r);
    const conditional = shuffle(quota<'y' | 'n'>({ y: 25, n: 25 }, PER_CLASS), r);
    // range cards: 5 PRICE_POSITION cards written in "k" or "hazaar" as a range
    let ranges = move === 'PRICE_POSITION' ? 5 : 0;
    let spelling = 0;
    for (let i = 0; i < PER_CLASS; i++) {
      const fmt = formats[i]!;
      const pool =
        fmt === 'none' ? SCENARIOS : SCENARIOS.filter((s) => COMPATIBLE[fmt].includes(s.scale));
      const sc = pool[Math.floor(r() * pool.length)]!;
      // a card that asks the writer to mention the quote must have a quote sent
      const sent = quoteSent[i] === 'y' || (fmt !== 'none' && ROLE[move] === 'quote_reference');
      const base: Omit<Card, 'card_id'> = {
        scenario_id: sc.id,
        work: sc.work,
        quote_sent: sent,
        quote_text: quoteText(sc),
        quote_rupees: sc.quote.toString(),
        quote_unit: unitOf(sc.scale),
        intended_move: move,
        objection: objections[i]!,
        language: languages[i]!,
        amount_format: fmt,
        hazaar_spelling: null,
        amount_role: null,
        amount_rupees: null,
        amount_high_rupees: null,
        amount_unit: null,
        amount_text: null,
        conditional: move === 'CONCESSION' ? conditional[i] === 'y' : null,
        ambiguous: ambiguous[i] === 'y',
      };
      if (fmt !== 'none') {
        const role = ROLE[move];
        const pm = PRICE_PERMILLE[move];
        const share = BigInt(pm[Math.floor(r() * pm.length)]!);
        const step = ROUND[sc.scale];
        const amount =
          role === 'quote_reference' ? sc.quote : roundTo((sc.quote * share) / 1000n, step);
        const sp =
          fmt === 'hazaar' ? HAZAAR_SPELLINGS[spelling++ % HAZAAR_SPELLINGS.length]! : undefined;
        let high: bigint | null = null;
        if (ranges > 0 && (fmt === 'k' || fmt === 'hazaar') && role === 'client_price') {
          high = amount + 5000n;
          ranges--;
        }
        const one = (x: bigint) => formatAmount(x, fmt, sp);
        base.hazaar_spelling = sp ?? null;
        base.amount_role = role;
        base.amount_rupees = amount.toString();
        base.amount_high_rupees = high === null ? null : high.toString();
        base.amount_unit = unitOf(sc.scale);
        base.amount_text =
          high === null
            ? one(amount)
            : fmt === 'k'
              ? `${one(amount).replace(/k$/, '')}-${one(high)}`
              : `${amount / 1000n}-${one(high)}`;
      }
      cards.push(base);
    }
  });
  // interleave the classes in writing order, then number the cards
  return shuffle(cards, r).map((c, i) => ({ card_id: `c${String(i + 1).padStart(3, '0')}`, ...c }));
};

/**
 * What the blind labeller is told about the deal (GUIDELINES §0): the quote, if one has been
 * sent, and nothing else. Stored with each label so the scorer knows what the labeller saw.
 */
export interface LabelContext {
  /** whole rupees as digits, or null when no quote has been sent */
  quote_rupees: string | null;
  quote_unit: QuoteUnit | null;
}
export const labelContext = (c: Card): LabelContext =>
  c.quote_sent
    ? { quote_rupees: c.quote_rupees, quote_unit: c.quote_unit }
    : { quote_rupees: null, quote_unit: null };

/** The one neutral context line, shown above the message in both tools. */
export const contextLine = (x: LabelContext): string => {
  if (x.quote_rupees === null) return 'No quote sent yet';
  const amount = formatAmount(BigInt(x.quote_rupees), 'rupee_comma');
  const per = x.quote_unit === 'hour' ? ' per hour' : x.quote_unit === 'month' ? ' per month' : '';
  return `Freelancer's quote so far: ${amount}${per}`;
};

/** One readable instruction per card, for the writing tool. */
export const describeCard = (c: Card): string[] => {
  const lang = c.language === 'en' ? 'English' : 'Roman-script Hinglish';
  const lines = [
    `You are the client. The freelancer is quoting for ${c.work}.`,
    c.quote_sent
      ? `They have already sent their quote: ${c.quote_text}.`
      : `They have not sent a quote yet (their price would be about ${c.quote_text}).`,
    `Write a message whose move is ${c.intended_move}${
      c.conditional === null
        ? ''
        : c.conditional
          ? ', asking for something in return'
          : ', asking nothing in return'
    }.`,
    c.objection === 'NONE' ? 'No objection.' : `Objection: ${c.objection}.`,
    `Language: ${lang}.`,
  ];
  if (c.amount_text === null) lines.push('No amount in the message.');
  else if (c.amount_role === 'quote_reference')
    lines.push(`Mention their quote, written like this: ${c.amount_text}.`);
  else lines.push(`Your price, written like this: ${c.amount_text}.`);
  if (c.ambiguous) lines.push('Make this one deliberately ambiguous: it could be read two ways.');
  return lines;
};

/** The coverage grid as Markdown tables. */
export const coverageMarkdown = (cards: Card[]): string => {
  const table = (title: string, cols: readonly string[], value: (c: Card) => string) => {
    const head = `| ${title} | ${cols.join(' | ')} | total |`;
    const sep = `|---|${cols.map(() => '---:').join('|')}|---:|`;
    const rows = MOVES.map((m) => {
      const mine = cards.filter((c) => c.intended_move === m);
      const n = cols.map((k) => String(mine.filter((c) => value(c) === k).length));
      return `| ${m} | ${n.join(' | ')} | ${mine.length} |`;
    });
    const tot = cols.map((k) => String(cards.filter((c) => value(c) === k).length));
    return [head, sep, ...rows, `| **total** | ${tot.join(' | ')} | ${cards.length} |`].join('\n');
  };
  return [
    table('move × language', ['en', 'hinglish'], (c) => c.language),
    table('move × objection', OBJECTION_VALUES, (c) => c.objection),
    table(
      'move × amount format',
      ['rupee_comma', 'k', 'hazaar', 'lakh', 'per_hour', 'none'],
      (c) => c.amount_format,
    ),
    table('move × hazaar spelling', ['hazaar', 'hajar', 'hazar'], (c) => c.hazaar_spelling ?? '-'),
    table('move × quote sent', ['true', 'false'], (c) => String(c.quote_sent)),
    table('move × ambiguous', ['true', 'false'], (c) => String(c.ambiguous)),
    table('move × conditional', ['true', 'false'], (c) => String(c.conditional)),
    table('move × range', ['range', 'single'], (c) =>
      c.amount_high_rupees === null ? (c.amount_rupees === null ? '-' : 'single') : 'range',
    ),
    table(
      'move × scenario',
      SCENARIOS.map((s) => s.id),
      (c) => c.scenario_id,
    ),
  ].join('\n\n');
};
