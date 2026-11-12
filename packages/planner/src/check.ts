/**
 * A5 number post-check: checkDraft(text, allowed) finds every number in a draft and fails the
 * draft if any of them cannot be mapped to an allowed value. Used on every draft: templates now,
 * LLM output later (Phase C2). It FAILS CLOSED: anything that looks numeric and is not an exact,
 * allowed value — or is written in a way we do not read (other scripts, look-alike digits,
 * hidden characters, ranges, hedges, a unit or currency swap) — rejects the draft.
 *
 * Two independent readers: this module's own scanner, and packages/analyser's amount parser as
 * a second pass. A number the analyser sees that the scanner did not approve fails the draft.
 */
import { Rational } from '@molbhav/engine';
import { findAmounts, hindiNumeral, normaliseWord } from '@molbhav/analyser';
import type { LadderUnit } from './types.ts';

export interface AllowedNumbers {
  prices: { rupees: bigint; unit: LadderUnit }[];
  percents: bigint[];
}

export type Reason =
  | 'not_allowed'
  | 'currency'
  | 'unit_swap'
  | 'approximate'
  | 'range'
  | 'inexact'
  | 'decimal'
  | 'bad_grouping'
  | 'non_ascii_digit'
  | 'hidden_char'
  | 'other_script'
  | 'lookalike'
  | 'roman_numeral'
  | 'number_word'
  | 'split_number'
  | 'tax_legal'
  | 'analyser_disagrees';

export interface Found {
  text: string;
  start: number;
  end: number;
  value: bigint | null;
  kind: 'money' | 'percent' | 'plain' | 'whole_text';
  ok: boolean;
  reason?: Reason;
}

export interface CheckResult {
  ok: boolean;
  found: Found[];
  offending: Found[];
}

// ------------------------------------------------------------------------------ word lists

const EN_UNITS = new Map<string, bigint>(
  'zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen'
    .split(' ')
    .map((w, i) => [w, BigInt(i)]),
);
const EN_TENS = new Map<string, bigint>([
  ['twenty', 20n],
  ['thirty', 30n],
  ['forty', 40n],
  ['fourty', 40n],
  ['fifty', 50n],
  ['sixty', 60n],
  ['seventy', 70n],
  ['eighty', 80n],
  ['ninety', 90n],
]);

/** words that carry a quantity we never put in a draft: always offending */
const QUANTITY_WORDS = new Set(
  [
    'double twice triple thrice quadruple dozen dozens couple pair once',
    'first second third fourth fifth sixth seventh eighth ninth tenth eleventh twelfth thirteenth',
    'fourteenth fifteenth sixteenth seventeenth eighteenth nineteenth twentieth thirtieth fortieth',
    'fiftieth sixtieth seventieth eightieth ninetieth hundredth thousandth millionth lakhth',
  ]
    .join(' ')
    .split(' '),
);
/** words read as a percentage */
const PCT_WORDS = new Map<string, bigint>([
  ['half', 50n],
  ['quarter', 25n],
  ['aadha', 50n],
  ['adha', 50n],
  ['aadhi', 50n],
  ['adhi', 50n],
]);

const HUNDRED = new Set(['hundred', 'hundreds', 'sau']);
const BIG_SCALES = new Map<string, bigint>();
for (const [mult, words] of [
  [
    1000n,
    'thousand thousands k grand hazaar hazar hajar hajaar hazzar hzar hazr hzr hjar hazaron hazaaron hajaron',
  ],
  [100000n, 'lakh lakhs laakh lac lacs lak laks lakhon laakhon'],
  [1000000n, 'million millions mn'],
  [10000000n, 'crore crores cr crs karod karor karoda karodon croron'],
  [1000000000n, 'billion billions bn'],
] as const)
  for (const w of words.split(' ')) BIG_SCALES.set(w, mult);
/** scale letters only when glued to digits: 45L, 2m */
const GLUED_SCALES = new Map<string, bigint>([
  ['l', 100000n],
  ['m', 1000000n],
]);

const FRACTION_START = new Map<string, Rational>([
  ['dedh', Rational.of(3n, 2n)],
  ['derh', Rational.of(3n, 2n)],
  ['dhed', Rational.of(3n, 2n)],
  ['dhai', Rational.of(5n, 2n)],
  ['dhaai', Rational.of(5n, 2n)],
  ['adhai', Rational.of(5n, 2n)],
  ['adhaai', Rational.of(5n, 2n)],
]);
const FRACTION_MOD = new Map<string, Rational>([
  ['sava', Rational.of(1n, 4n)],
  ['sawa', Rational.of(1n, 4n)],
  ['savaa', Rational.of(1n, 4n)],
  ['saade', Rational.of(1n, 2n)],
  ['sade', Rational.of(1n, 2n)],
  ['saadhe', Rational.of(1n, 2n)],
  ['sadhe', Rational.of(1n, 2n)],
  ['paune', Rational.of(-1n, 4n)],
  ['pone', Rational.of(-1n, 4n)],
]);

const INR_BEFORE = new Set(['₹', 'rs', 'inr', 'rupees', 'rupee', 'rupaye', 'rupaiye', 'rupay']);
const INR_AFTER = new Set(['rs', 'inr', 'rupees', 'rupee', 'rupaye', 'rupaiye', 'rupay', 'rupiya']);
const FOREIGN = new Set([
  '$',
  '€',
  '£',
  '¥',
  'usd',
  'dollar',
  'dollars',
  'eur',
  'euro',
  'euros',
  'gbp',
  'pound',
  'pounds',
  'aed',
  'dirham',
  'dirhams',
  'sgd',
  'cad',
  'aud',
]);
const PCT_AFTER = new Set(['%', 'percent', 'pct', 'pratishat', 'fisadi', 'per']);
const HEDGE_BEFORE = new Set(
  'around about approx approximately roughly nearly almost lagbhag takriban kareeb karib upto under below max maximum min minimum least ~ ≈'.split(
    ' ',
  ),
);
const HEDGE_AFTER = new Set([
  'ish',
  'odd',
  '+',
  'plus',
  'approx',
  'thereabouts',
  'onwards',
  'upwards',
]);
const HEDGE_OR = new Set([
  'so',
  'thereabouts',
  'more',
  'less',
  'above',
  'below',
  'higher',
  'lower',
  'over',
  'under',
]);
const HEDGE_KE = new Set([
  'aas',
  'aaspaas',
  'aspas',
  'kareeb',
  'karib',
  'around',
  'lagbhag',
  'upar',
  'neeche',
]);
const RANGE_JOIN = new Set(['-', '–', '—', 'to', 'se', '/', 'till', 'tak']);
const UNIT_WORDS = new Map<string, 'hour' | 'day' | 'week' | 'month' | 'year'>([
  ['hour', 'hour'],
  ['hours', 'hour'],
  ['hr', 'hour'],
  ['hrs', 'hour'],
  ['hourly', 'hour'],
  ['ghanta', 'hour'],
  ['ghante', 'hour'],
  ['day', 'day'],
  ['days', 'day'],
  ['daily', 'day'],
  ['din', 'day'],
  ['roz', 'day'],
  ['rozana', 'day'],
  ['week', 'week'],
  ['weeks', 'week'],
  ['weekly', 'week'],
  ['hafta', 'week'],
  ['hafte', 'week'],
  ['month', 'month'],
  ['months', 'month'],
  ['mo', 'month'],
  ['monthly', 'month'],
  ['mahina', 'month'],
  ['mahine', 'month'],
  ['year', 'year'],
  ['years', 'year'],
  ['yr', 'year'],
  ['yearly', 'year'],
  ['annually', 'year'],
  ['annual', 'year'],
  ['saal', 'year'],
]);
const UNIT_LEAD = new Set(['per', '/', 'a', 'an', 'every', 'har', 'each']);
const AMBIGUOUS_HINDI = new Set(['ek', 'aik', 'do']);
const NEAR_NUMBER = new Set([...UNIT_WORDS.keys(), 'baar', 'log', 'logon', 'cheezein']);
const TAX_LEGAL =
  /\b(gst|tds|igst|cgst|sgst|tax|taxes|taxed|vat|cess|legal|legally|lawyer|lawyers|advocate|court|lawsuit|sue)\b/i;
const ROMAN = /^(?=[MDCLXVI]{2,}$)M{0,4}(CM|CD|D?C{0,3})(XC|XL|L?X{0,3})(IX|IV|V?I{0,3})$/;

// ------------------------------------------------------------------------------ tokens

interface Tok {
  kind: 'num' | 'word' | 'sym';
  raw: string;
  w: string;
  start: number;
  end: number;
  /** whitespace (or the start of the text) before this token */
  gap: boolean;
}

const tokenize = (text: string): Tok[] => {
  const out: Tok[] = [];
  for (const m of text.matchAll(/[0-9]+(?:[.,][0-9]+)*|[A-Za-z]+|\S/gu)) {
    const raw = m[0];
    const start = m.index ?? 0;
    const prev = text[start - 1] ?? ' ';
    out.push({
      kind: /^[0-9]/.test(raw) ? 'num' : /^[A-Za-z]/.test(raw) ? 'word' : 'sym',
      raw,
      w: raw.toLowerCase(),
      start,
      end: start + raw.length,
      gap: start === 0 || /\s/u.test(prev),
    });
  }
  return out;
};

const GROUPING = [/^[0-9]+$/, /^[0-9]{1,3}(,[0-9]{3})+$/, /^[0-9]{1,2}(,[0-9]{2})*,[0-9]{3}$/];

const isNumberWord = (w: string): boolean =>
  EN_UNITS.has(w) ||
  EN_TENS.has(w) ||
  HUNDRED.has(w) ||
  BIG_SCALES.has(w) ||
  FRACTION_START.has(w) ||
  FRACTION_MOD.has(w) ||
  (hindiNumeral(w) !== null && !AMBIGUOUS_HINDI.has(normaliseWord(w)));

// ------------------------------------------------------------------------------ phrases

interface Phrase {
  first: number;
  last: number;
  value: Rational | null;
  reason?: Reason;
}

/** Read one number phrase starting at token i, or null if token i does not start one. */
const readPhrase = (t: Tok[], i: number): Phrase | null => {
  const tok = t[i]!;
  const next = (j: number) => t[j];
  const isScaleWord = (x: Tok | undefined) => !!x && (HUNDRED.has(x.w) || BIG_SCALES.has(x.w));

  // decide whether token i starts a phrase
  if (tok.kind === 'word') {
    const w = tok.w;
    const nw = normaliseWord(w);
    if (AMBIGUOUS_HINDI.has(nw)) {
      // "ek"/"do" are also the article and "give": a number only next to a scale, digits,
      // another number word, a unit, a currency or a percent sign
      const n = next(i + 1);
      const p = t[i - 1];
      const near =
        (!!n &&
          (n.kind === 'num' ||
            isScaleWord(n) ||
            isNumberWord(n.w) ||
            NEAR_NUMBER.has(n.w) ||
            INR_AFTER.has(n.w) ||
            PCT_AFTER.has(n.w))) ||
        (!!p && (INR_BEFORE.has(p.w) || FOREIGN.has(p.w)));
      if (!near) return null;
    } else if (w === 'a' || w === 'an') {
      if (!isScaleWord(next(i + 1))) return null;
    } else if (!isNumberWord(w)) return null;
  } else if (tok.kind !== 'num') return null;

  let total = Rational.of(0n);
  let current: Rational | null = null;
  let pending: Rational | null = null;
  let afterHundred = false;
  let lastTens = false;
  let reason: Reason | undefined;
  let j = i;
  let last = i;
  const add = (v: Rational) => {
    current = (current ?? Rational.of(0n)).add(v.add(pending ?? Rational.of(0n)));
    pending = null;
  };

  for (; j < t.length; j++) {
    const x = t[j]!;
    const w = x.w;
    const nw = normaliseWord(w);
    const startNew = current !== null && !afterHundred;
    if (x.kind === 'num') {
      if (j !== i && (current !== null || total.cmp(Rational.of(0n)) !== 0)) break;
      const intPart = x.raw.includes('.') ? x.raw.slice(0, x.raw.indexOf('.')) : x.raw;
      if (!GROUPING.some((g) => g.test(intPart))) reason ??= 'bad_grouping';
      if ((x.raw.match(/\./g) ?? []).length > 1) reason ??= 'bad_grouping';
      const v = Rational.parse(x.raw.replace(/,/g, ''));
      if (v === null) {
        reason ??= 'bad_grouping';
        add(Rational.of(0n));
      } else add(v);
      const glued = t[j + 1];
      if (x.raw.includes('.')) {
        const scaleNext =
          glued && (BIG_SCALES.has(glued.w) || HUNDRED.has(glued.w) || GLUED_SCALES.has(glued.w));
        if (!scaleNext) reason ??= 'decimal';
      }
      if (glued && !glued.gap && glued.kind === 'word' && GLUED_SCALES.has(glued.w)) {
        total = total.add(current!.mul(Rational.of(GLUED_SCALES.get(glued.w)!)));
        current = null;
        j++;
        last = j;
        continue;
      }
      last = j;
      lastTens = false;
      continue;
    }
    if (x.kind === 'word') {
      if (EN_UNITS.has(w)) {
        if (startNew && !(lastTens && EN_UNITS.get(w)! < 10n)) break;
        add(Rational.of(EN_UNITS.get(w)!));
        lastTens = false;
        last = j;
        continue;
      }
      if (EN_TENS.has(w)) {
        if (startNew) break;
        add(Rational.of(EN_TENS.get(w)!));
        lastTens = true;
        last = j;
        continue;
      }
      if (HUNDRED.has(w)) {
        current = (current ?? Rational.of(1n)).mul(Rational.of(100n));
        afterHundred = true;
        lastTens = false;
        last = j;
        continue;
      }
      if (BIG_SCALES.has(w)) {
        total = total.add((current ?? Rational.of(1n)).mul(Rational.of(BIG_SCALES.get(w)!)));
        current = null;
        afterHundred = true; // a smaller number may follow: "forty five thousand five hundred"
        lastTens = false;
        last = j;
        continue;
      }
      if (FRACTION_START.has(nw) || FRACTION_START.has(w)) {
        if (current !== null) break;
        current = FRACTION_START.get(nw) ?? FRACTION_START.get(w)!;
        last = j;
        continue;
      }
      if (FRACTION_MOD.has(nw) || FRACTION_MOD.has(w)) {
        if (startNew) break;
        pending = FRACTION_MOD.get(nw) ?? FRACTION_MOD.get(w)!;
        last = j;
        continue;
      }
      const h = hindiNumeral(w);
      if (h !== null && (j === i || !AMBIGUOUS_HINDI.has(nw))) {
        if (startNew) break;
        add(Rational.of(h));
        lastTens = false;
        last = j;
        continue;
      }
      if ((w === 'a' || w === 'an') && j === i) {
        current = Rational.of(1n);
        last = j;
        continue;
      }
      if (w === 'and' && j !== i) {
        const n = t[j + 1];
        if (n && n.kind === 'word' && isNumberWord(n.w)) continue;
      }
      break;
    }
    // symbols: "forty-five" joins words; anything else ends the phrase
    if ((x.raw === '-' || x.raw === '‐') && !x.gap) {
      const n = t[j + 1];
      if (lastTens && n && !n.gap && EN_UNITS.has(n.w)) continue;
    }
    break;
  }
  if (pending !== null) reason ??= 'number_word';
  const value = total.add(current ?? Rational.of(0n));
  return { first: i, last, value, ...(reason ? { reason } : {}) };
};

// ------------------------------------------------------------------------------ the check

const whole = (start: number, end: number, text: string, reason: Reason): Found => ({
  text: text.slice(start, end),
  start,
  end,
  value: null,
  kind: 'whole_text',
  ok: false,
  reason,
});

export const checkDraft = (text: string, allowed: AllowedNumbers): CheckResult => {
  const found: Found[] = [];

  // whole-text screens: characters we never write, so we never try to read them
  for (const m of text.matchAll(/\p{Cf}/gu))
    found.push(whole(m.index!, m.index! + m[0].length, text, 'hidden_char'));
  for (const m of text.matchAll(/[\p{Nd}\p{No}\p{Nl}]/gu))
    if (!/[0-9]/.test(m[0]))
      found.push(whole(m.index!, m.index! + m[0].length, text, 'non_ascii_digit'));
  for (const m of text.matchAll(/[^\p{Script=Latin}\p{Script=Common}\p{Script=Inherited}]/gu))
    found.push(whole(m.index!, m.index! + m[0].length, text, 'other_script'));
  for (const m of text.matchAll(/[0-9][.,]?[OoIl]|[OoIl][.,]?[0-9]/g))
    found.push(whole(m.index!, m.index! + m[0].length, text, 'lookalike'));
  const tax = TAX_LEGAL.exec(text);
  if (tax) found.push(whole(tax.index, tax.index + tax[0].length, text, 'tax_legal'));

  const t = tokenize(text);
  for (const x of t)
    if (x.kind === 'word' && ROMAN.test(x.raw))
      found.push(whole(x.start, x.end, text, 'roman_numeral'));
    else if (x.kind === 'word' && QUANTITY_WORDS.has(x.w))
      found.push(whole(x.start, x.end, text, 'number_word'));

  // a number word split by spaces, hyphens or dots ("fif ty", "thou-sand", "l a k h")
  const SPLIT_JOIN = new Set(['-', '_', '.', '·', '*', '‐']);
  const numberish = (w: string) =>
    isNumberWord(w) || isNumberWord(normaliseWord(w)) || QUANTITY_WORDS.has(w) || PCT_WORDS.has(w);
  for (let i = 0; i < t.length; i++) {
    if (t[i]!.kind !== 'word') continue;
    let joined = t[i]!.w;
    let j = i;
    for (let parts = 1; parts < 8; parts++) {
      let k = j + 1;
      if (t[k] && t[k]!.kind === 'sym' && SPLIT_JOIN.has(t[k]!.raw)) k++;
      const n = t[k];
      if (!n || n.kind !== 'word') break;
      joined += n.w;
      j = k;
      if (numberish(joined) && !(numberish(t[i]!.w) && numberish(n.w))) {
        found.push(whole(t[i]!.start, n.end, text, 'split_number'));
        break;
      }
    }
  }

  // number phrases
  const phrases: Phrase[] = [];
  for (let i = 0; i < t.length; i++) {
    const p = readPhrase(t, i);
    if (!p) {
      const w = t[i]!.w;
      if (PCT_WORDS.has(w)) phrases.push({ first: i, last: i, value: null });
      continue;
    }
    phrases.push(p);
    i = p.last;
  }

  const prices = allowed.prices;
  const isAllowedPrice = (v: bigint) => prices.find((p) => p.rupees === v);
  phrases.forEach((p, k) => {
    const a = t[p.first]!;
    const b = t[p.last]!;
    const f: Found = {
      text: text.slice(a.start, b.end),
      start: a.start,
      end: b.end,
      value: null,
      kind: 'plain',
      ok: false,
    };
    found.push(f);
    // a percentage word ("half") on its own
    if (p.value === null) {
      const v = PCT_WORDS.get(a.w)!;
      f.value = v;
      f.kind = 'percent';
      if (allowed.percents.includes(v)) f.ok = true;
      else f.reason = 'not_allowed';
      return;
    }
    if (p.reason) {
      f.reason = p.reason;
      return;
    }
    if (!p.value.isInteger()) {
      f.reason = 'inexact';
      return;
    }
    f.value = p.value.n;
    // context before: a currency mark ("₹", "Rs.", "INR", "$"), then the word before it
    let bi = p.first - 1;
    while (bi >= 0 && (INR_BEFORE.has(t[bi]!.w) || FOREIGN.has(t[bi]!.w) || t[bi]!.w === '.')) {
      if (FOREIGN.has(t[bi]!.w)) f.reason = 'currency';
      if (INR_BEFORE.has(t[bi]!.w)) f.kind = 'money';
      bi--;
    }
    const before = t[bi];
    const before2 = t[bi - 1];
    if (before && HEDGE_BEFORE.has(before.w)) f.reason ??= 'approximate';
    if (before?.w === 'to' && before2?.w === 'up') f.reason ??= 'approximate';
    // context after
    let j = p.last + 1;
    const after = t[j];
    if (after && FOREIGN.has(after.w)) f.reason ??= 'currency';
    if (after && INR_AFTER.has(after.w)) {
      f.kind = 'money';
      j++;
    }
    const a1 = t[j];
    if (a1 && PCT_AFTER.has(a1.w) && !(a1.w === 'per' && t[j + 1]?.w !== 'cent')) {
      f.kind = 'percent';
    }
    if (a1 && HEDGE_AFTER.has(a1.w)) f.reason ??= 'approximate';
    if (a1?.raw === '-' && t[j + 1]?.w === 'ish') f.reason ??= 'approximate';
    // two-word hedges after: "or so", "or more", "ke aas paas", "ke kareeb", "ya usse kam"
    const a2 = t[j + 1]?.w;
    if (a1?.w === 'or' && a2 !== undefined && HEDGE_OR.has(a2)) f.reason ??= 'approximate';
    if ((a1?.w === 'ke' || a1?.w === 'ki') && a2 !== undefined && HEDGE_KE.has(a2))
      f.reason ??= 'approximate';
    if (a1?.w === 'ya' && (a2 === 'usse' || a2 === 'isse' || a2 === 'zyada' || a2 === 'kam'))
      f.reason ??= 'approximate';
    // unit after: "per hour", "/month", "a day", "hourly", "per din", "mahina"
    let unit: 'hour' | 'day' | 'week' | 'month' | 'year' | null = null;
    if (a1 && UNIT_WORDS.has(a1.w)) unit = UNIT_WORDS.get(a1.w)!;
    else if (a1 && UNIT_LEAD.has(a1.w) && t[j + 1] && UNIT_WORDS.has(t[j + 1]!.w))
      unit = UNIT_WORDS.get(t[j + 1]!.w)!;
    // range with the next phrase: only joiners between them
    const nextP = phrases[k + 1];
    const prevP = phrases[k - 1];
    const joined = (x: Phrase | undefined, y: Phrase | undefined) =>
      !!x &&
      !!y &&
      y.first > x.last &&
      t.slice(x.last + 1, y.first).length > 0 &&
      t.slice(x.last + 1, y.first).length <= 3 &&
      t
        .slice(x.last + 1, y.first)
        .every((z) => RANGE_JOIN.has(z.w) || INR_BEFORE.has(z.w) || z.w === 'between') &&
      t.slice(x.last + 1, y.first).some((z) => RANGE_JOIN.has(z.w));
    if (joined(p, nextP) || joined(prevP, p)) f.reason ??= 'range';
    if (before?.w === 'between') f.reason ??= 'range';
    if (f.reason) return;

    if (f.kind === 'percent') {
      if (allowed.percents.includes(f.value)) f.ok = true;
      else f.reason = 'not_allowed';
      return;
    }
    const match = isAllowedPrice(f.value);
    if (!match) {
      f.reason = 'not_allowed';
      return;
    }
    if (unit !== null && !(unit === match.unit)) {
      f.reason = 'unit_swap';
      return;
    }
    f.ok = true;
  });

  // second reader: every amount or number the analyser finds must sit on an approved number
  const approved = found.filter((f) => f.ok);
  const { candidates, ignored } = findAmounts(text);
  const spans = [
    ...candidates.map((c) => ({ span: c.span, rupees: c.rupees })),
    ...ignored.map((g) => ({ span: g.span, rupees: null as bigint | null })),
  ];
  for (const s of spans) {
    const over = found.filter((f) => f.start < s.span.end && s.span.start < f.end);
    if (over.length === 0)
      found.push({
        text: s.span.text,
        start: s.span.start,
        end: s.span.end,
        value: s.rupees,
        kind: 'plain',
        ok: false,
        reason: 'analyser_disagrees',
      });
    else if (
      s.rupees !== null &&
      over.every((f) => f.ok) &&
      !approved.some((f) => over.includes(f) && f.value === s.rupees)
    )
      found.push({
        text: s.span.text,
        start: s.span.start,
        end: s.span.end,
        value: s.rupees,
        kind: 'plain',
        ok: false,
        reason: 'analyser_disagrees',
      });
  }

  found.sort((x, y) => x.start - y.start || x.end - y.end);
  const offending = found.filter((f) => !f.ok);
  return { ok: offending.length === 0, found, offending };
};
