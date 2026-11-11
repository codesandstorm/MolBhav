/**
 * Amount parser for client messages (S4b), written from ml/gold/GUIDELINES.md v0.2 §4 and the
 * card generator's formats only, before any gold message exists.
 *
 * Reads ₹ / Rs / INR / rupees, 45,000 and 4,50,000, 45k, 1.5L / 1.5 lakh, hazaar / hajar / hazar,
 * crore, English and Roman-Hindi number words with a scale ("tees hazaar", "dedh lakh",
 * "thirty thousand"), ranges ("40-45k", "40 se 45 hazaar") and units (per hour / day / month,
 * fixed). Counts, durations, percentages, times, dates, phone numbers and years are not prices.
 *
 * Money stays exact: every amount is bigint rupees, worked out with integer fractions; there
 * are no floats here (the engine's no-float lint applies to this file). When a careful reader
 * could not settle the exact rupees, the reading is marked ambiguous: the parser fails closed
 * rather than guess. It never produces a floor, a target or an opening; it only reads.
 */
import type { Currency, Unit } from './labels.ts';

export interface Span {
  /** UTF-16 offsets into the message */
  start: number;
  end: number;
  text: string;
}

export type AmountFlag =
  /** "₹45,000.50": rupees and paise */
  | 'paise'
  /** "4,5,000": commas in neither Indian nor Western grouping */
  | 'bad_grouping'
  /** $, USD, € …: not rupees */
  | 'not_inr'
  /** "30-ish", "~45k", "45k odd" */
  | 'approximate'
  /** a scaled amount that is not a whole number of rupees ("1.234567L") */
  | 'inexact'
  /** a bare number under 1,000 with no currency, scale or unit ("40 kar denge"): the scale is unclear */
  | 'bare_small'
  /** a range whose low end is above its high end */
  | 'range_order'
  /** two different client prices in one message (GUIDELINES §4 rule 3) */
  | 'competing';

/** price: the client's own; reference: the freelancer's quote; rejected: a number the client turns down */
export type AmountRole = 'price' | 'reference' | 'rejected';

export interface AmountCandidate {
  rupees: bigint | null;
  rupeesHigh: bigint | null;
  unit: Unit;
  currency: Currency;
  span: Span;
  role: AmountRole;
  /** has a currency mark, a scale word, a unit or digit grouping */
  strong: boolean;
  /** "around", "lagbhag", "about" before it */
  hedged: boolean;
  flags: AmountFlag[];
}

export type IgnoredReason = 'percent' | 'count' | 'time' | 'date' | 'phone' | 'year' | 'code';

export interface IgnoredNumber {
  span: Span;
  reason: IgnoredReason;
}

export interface AmountReading {
  /** the client's price in whole rupees, or null (none found, or it cannot be settled exactly) */
  rupees: bigint | null;
  rupeesHigh: bigint | null;
  unit: Unit | null;
  currency: Currency | null;
  span: Span | null;
  ambiguous: boolean;
  flags: AmountFlag[];
  /** every amount read, in order, including references to the freelancer's quote */
  candidates: AmountCandidate[];
  /** numbers that were read as not-a-price */
  ignored: IgnoredNumber[];
}

// ---------------------------------------------------------------------------------------------
// Tokens

interface Tok {
  kind: 'num' | 'word' | 'sym';
  raw: string;
  /** lower case (tokens are ASCII letters, so the length is unchanged) */
  w: string;
  start: number;
  end: number;
  /** whitespace (or the start of the text) before this token */
  gap: boolean;
}

const TOKEN_RE = /\d(?:[\d,]*\d)?(?:\.\d+)?|[A-Za-z]+|\S/gu;
const SPACE_RE = /\s/u;

const tokenize = (text: string): Tok[] => {
  const out: Tok[] = [];
  for (const m of text.matchAll(TOKEN_RE)) {
    const raw = m[0];
    const start = m.index ?? 0;
    const first = raw[0] ?? '';
    out.push({
      kind: /\d/.test(first) ? 'num' : /[A-Za-z]/.test(first) ? 'word' : 'sym',
      raw,
      w: raw.toLowerCase(),
      start,
      end: start + raw.length,
      gap: start === 0 || SPACE_RE.test(text[start - 1] ?? ''),
    });
  }
  return out;
};

/** Spelling normaliser for Roman Hindi: "paanch" → "panch", "chhe" → "che", "sawa" → "sava". */
export const normaliseWord = (w: string): string =>
  w
    .toLowerCase()
    .replace(/chh/g, 'ch')
    .replace(/w/g, 'v')
    .replace(/(.)\1+/g, '$1');

// ---------------------------------------------------------------------------------------------
// Number words

const ENGLISH_ONES = new Map<string, bigint>(
  [
    'one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen',
    'sixteen seventeen eighteen nineteen',
  ]
    .join(' ')
    .split(' ')
    .map((w, i) => [w, BigInt(i + 1)]),
);
const ENGLISH_TENS = new Map<string, bigint>(
  'twenty thirty forty fifty sixty seventy eighty ninety'
    .split(' ')
    .map((w, i) => [w, BigInt(i + 2) * 10n]),
);

/** Roman-Hindi numerals 1–99 with common spellings (each line: value, spellings). */
const HINDI_SRC = `1 ek aik
2 do
3 teen tin
4 char chaar
5 paanch panch
6 chhe chhah che chah chheh chhey
7 saat
8 aath
9 nau nao
10 das dus
11 gyarah gyaarah gyara igyarah
12 barah baarah bara
13 terah tera
14 chaudah chaudha chouda choudah chauda
15 pandrah pandra pundrah pandhra
16 solah sola
17 satrah satarah satra
18 atharah athara attharah athra
19 unnis unees unis
20 bees bis
21 ikkis ikkees ekkis
22 bais baais baees
23 teis teyis
24 chaubis chaubees chobis
25 pachchis pachis pachees
26 chhabbis chabbis chhabees
27 sattais sataees sattaees
28 atthais athais athaees
29 untis unatis untees
30 tees tis
31 iktees ikattis ikatis iktis
32 battis battees
33 taintis taintees tetis tentis
34 chautis chauntis chontis chautees
35 paintis paintees pentis
36 chhattis chattis chhattees
37 saintis saintees sentis
38 adtis artis aratis adtees artees
39 untalis unchalis untalees
40 chalis chaalis chalees chaalees
41 iktalis iktalees ektalis
42 bayalis byalis bayalees beyalis
43 taintalis tetalis taintalees tentalis
44 chavalis chauvalis chawalis chauwalis
45 paintalis paintalees pentalis paitalis
46 chhiyalis chhiyalees chiyalis
47 saintalis saintalees sentalis
48 adtalis artalis adtalees artalees
49 unchas unanchas unchaas
50 pachas pachaas
51 ikyavan ikyaavan ekyavan
52 bavan baavan
53 tirpan tirepan trepan
54 chauvan chouvan
55 pachpan pachapan
56 chhappan chappan
57 sattavan satavan
58 atthavan athavan
59 unsath unsaath
60 saath
61 iksath iksaath
62 basath baasath
63 tirsath tiresath
64 chausath chausaath
65 painsath painsaath
66 chhiyasath chhiyaasath
67 sadsath sarsath
68 adsath arsath
69 unhattar
70 sattar
71 ikhattar
72 bahattar
73 tihattar
74 chauhattar
75 pachhattar pachattar
76 chhihattar
77 sathattar
78 athhattar athattar
79 unasi unaasi
80 assi
81 ikyasi
82 bayasi
83 tirasi
84 chaurasi
85 pachasi pachaasi
86 chhiyasi
87 sattasi
88 athasi atthasi
89 navasi nawasi
90 nabbe
91 ikyanve
92 banve baanve
93 tiranve
94 chauranve
95 pachanve
96 chhiyanve
97 sattanve
98 atthanve
99 ninyanve ninnanve`;

const HINDI = new Map<string, bigint>();
for (const line of HINDI_SRC.split('\n')) {
  const [value, ...spellings] = line.trim().split(/\s+/);
  const v = BigInt(value ?? '0');
  for (const s of spellings) {
    const k = normaliseWord(s);
    const prev = HINDI.get(k);
    if (prev !== undefined && prev !== v) throw new Error(`Hindi numeral spelling collision: ${s}`);
    HINDI.set(k, v);
  }
}
/** exposed for the collision test */
export const hindiNumeral = (w: string): bigint | null => HINDI.get(normaliseWord(w)) ?? null;

const list = (s: string) => new Set(s.split(/\s+/).map(normaliseWord));
const DEDH = list('dedh derh dhed'); // 1½
const DHAI = list('dhai dhaai adhai adhaai dhayi dhaayi'); // 2½
const SAVA = list('sava sawa savaa'); // x¼
const SAADE = list('saade sade saadhe sadhe'); // x½
const PAUNE = list('paune pone'); // x − ¼

const SCALES = new Map<string, bigint>();
for (const [mult, words] of [
  [100n, 'hundred hundreds sau'],
  [1000n, 'thousand thousands hazaar hazar hajar hajaar hazzar hzar hazr hzr hjar'],
  [100000n, 'lakh lakhs laakh lac lacs lak laks lakhs'],
  [10000000n, 'crore crores cr crs karod karor karoda'],
] as const) {
  for (const w of words.split(' ')) SCALES.set(normaliseWord(w), mult);
}

// ---------------------------------------------------------------------------------------------
// Exact fractions

interface Rat {
  n: bigint;
  d: bigint;
}
const add = (a: Rat, b: Rat): Rat => ({ n: a.n * b.d + b.n * a.d, d: a.d * b.d });
const times = (a: Rat, m: bigint): Rat => ({ n: a.n * m, d: a.d });

const WESTERN = /^\d{1,3}(?:,\d{3})+$/;
const INDIAN = /^\d{1,2}(?:,\d{2})*,\d{3}$/;

const digitsOf = (t: Tok) => {
  const [int = '', frac = ''] = t.raw.split('.');
  const comma = int.includes(',');
  return {
    rat: { n: BigInt(int.replace(/,/g, '') + frac), d: 10n ** BigInt(frac.length) },
    comma,
    decimal: frac.length > 0,
    badGrouping: comma && !WESTERN.test(int) && !INDIAN.test(int),
    plainDigits: comma || frac.length > 0 ? null : int,
  };
};

// ---------------------------------------------------------------------------------------------
// Expressions: numeral [scale] (numeral scale)* — e.g. "1 lakh 20 hazaar", "do hazaar paanch sau"

interface Numeral {
  rat: Rat;
  next: number;
  word: boolean;
  digits: ReturnType<typeof digitsOf> | null;
}
interface Scale {
  mult: bigint;
  approx: boolean;
}
interface Expr {
  rat: Rat;
  start: number;
  end: number;
  topScale: bigint | null;
  word: boolean;
  approx: boolean;
  /** set when the expression is a single digit token with no scale */
  digits: ReturnType<typeof digitsOf> | null;
  comma: boolean;
  badGrouping: boolean;
}

const scaleAt = (toks: Tok[], j: number): Scale | null => {
  const t = toks[j];
  if (!t || t.kind !== 'word') return null;
  if (t.raw === 'k' || t.raw === 'K') return { mult: 1000n, approx: false };
  if (t.raw === 'L' || (t.raw === 'l' && !t.gap)) return { mult: 100000n, approx: false };
  if (!t.gap && /^kish$/i.test(t.raw)) return { mult: 1000n, approx: true };
  if (!t.gap && /^lish$/i.test(t.raw)) return { mult: 100000n, approx: true };
  const m = SCALES.get(normaliseWord(t.w));
  return m === undefined ? null : { mult: m, approx: false };
};

const baseNumeral = (toks: Tok[], i: number): Numeral | null => {
  const t = toks[i];
  if (!t) return null;
  if (t.kind === 'num') {
    const d = digitsOf(t);
    return { rat: d.rat, next: i + 1, word: false, digits: d };
  }
  if (t.kind !== 'word') return null;
  const tens = ENGLISH_TENS.get(t.w);
  if (tens !== undefined) {
    const a = toks[i + 1];
    const b = toks[i + 2];
    if (a?.kind === 'sym' && a.raw === '-' && b && (ENGLISH_ONES.get(b.w) ?? 99n) < 10n)
      return {
        rat: { n: tens + ENGLISH_ONES.get(b.w)!, d: 1n },
        next: i + 3,
        word: true,
        digits: null,
      };
    if (a && (ENGLISH_ONES.get(a.w) ?? 99n) < 10n)
      return {
        rat: { n: tens + ENGLISH_ONES.get(a.w)!, d: 1n },
        next: i + 2,
        word: true,
        digits: null,
      };
    return { rat: { n: tens, d: 1n }, next: i + 1, word: true, digits: null };
  }
  const one = ENGLISH_ONES.get(t.w);
  if (one !== undefined) return { rat: { n: one, d: 1n }, next: i + 1, word: true, digits: null };
  if (t.w === 'a' || t.w === 'an') {
    const s = toks[i + 1];
    if (s && s.w !== 'k' && s.w !== 'l' && scaleAt(toks, i + 1))
      return { rat: { n: 1n, d: 1n }, next: i + 1, word: true, digits: null };
    return null;
  }
  const h = HINDI.get(normaliseWord(t.w));
  return h === undefined ? null : { rat: { n: h, d: 1n }, next: i + 1, word: true, digits: null };
};

const numeral = (toks: Tok[], i: number): Numeral | null => {
  const t = toks[i];
  if (t?.kind === 'word') {
    const n = normaliseWord(t.w);
    if (DEDH.has(n)) return { rat: { n: 3n, d: 2n }, next: i + 1, word: true, digits: null };
    if (DHAI.has(n)) return { rat: { n: 5n, d: 2n }, next: i + 1, word: true, digits: null };
    if (SAVA.has(n) || SAADE.has(n) || PAUNE.has(n)) {
      const b = baseNumeral(toks, i + 1);
      const x: Rat | null = b
        ? b.rat
        : SAVA.has(n) && scaleAt(toks, i + 1)
          ? { n: 1n, d: 1n }
          : null;
      if (!x) return null;
      const next = b ? b.next : i + 1;
      const r: Rat = SAVA.has(n)
        ? add(x, { n: 1n, d: 4n })
        : SAADE.has(n)
          ? add(x, { n: 1n, d: 2n })
          : add(x, { n: -1n, d: 4n });
      return { rat: r, next, word: true, digits: null };
    }
  }
  return baseNumeral(toks, i);
};

const expression = (toks: Tok[], i: number): Expr | null => {
  const first = numeral(toks, i);
  if (!first) return null;
  const s = scaleAt(toks, first.next);
  const base = {
    start: i,
    word: first.word,
    comma: first.digits?.comma ?? false,
    badGrouping: first.digits?.badGrouping ?? false,
  };
  if (!s)
    return {
      ...base,
      rat: first.rat,
      end: first.next,
      topScale: null,
      approx: false,
      digits: first.digits,
    };
  let rat = times(first.rat, s.mult);
  let end = first.next + 1;
  let last = s.mult;
  let approx = s.approx;
  for (;;) {
    const n = numeral(toks, end);
    if (!n) break;
    const s2 = scaleAt(toks, n.next);
    if (s2 && s2.mult < last) {
      rat = add(rat, times(n.rat, s2.mult));
      end = n.next + 1;
      last = s2.mult;
      approx ||= s2.approx;
      continue;
    }
    // a trailing word numeral below the last scale: "do hazaar paanch sau", "five hundred fifty"
    if (!s2 && n.word && last >= 100n && n.rat.n < last * n.rat.d) {
      rat = add(rat, n.rat);
      end = n.next;
    }
    break;
  }
  return { ...base, rat, end, topScale: s.mult, approx, digits: null };
};

// ---------------------------------------------------------------------------------------------
// Context

const INR_BEFORE = new Set(['rs', 'inr', 'rupees', 'rupee', 'rupaye']);
const OTHER_BEFORE = new Set(['usd', 'eur', 'gbp', 'aed', 'us']);
const INR_AFTER = new Set([
  'rupees',
  'rupee',
  'rupay',
  'rupaye',
  'rupaiye',
  'rupaiya',
  'rupiya',
  'rupiye',
  'rupye',
  'rs',
  'inr',
]);
const OTHER_AFTER = new Set([
  'dollars',
  'dollar',
  'usd',
  'euros',
  'euro',
  'eur',
  'pounds',
  'gbp',
  'aed',
  'dirhams',
]);

const COUNT_NOUNS = new Set(
  `page pages screen screens revision revisions round rounds logo logos design designs post posts reel reels
video videos section sections product products item items user users people person persons member members
day days din week weeks hafta hafte hafton month months mahina mahine mahino mahinon year years yr yrs saal sal
hour hours hr hrs ghanta ghante ghanton minute minutes min mins second seconds sec secs baar time times call calls
meeting meetings iteration iterations version versions option options concept concepts language languages colour
colours color colors font fonts slide slides banner banners email emails mail mails word words article articles
blog blogs image images photo photos picture pictures sku skus feature features module modules app apps website
websites site sites file files gb mb tb kb km kg star stars rating gst tds employee employees student students
batch batches quarter quarters installment installments instalment instalments milestone milestones part parts
phase phases stage stages payment payments step steps point points line lines template templates variation
variations size sizes inch inches px mm cm ft x pcs pieces piece set sets`.split(/\s+/),
);
const COUNT_MODIFIERS = new Set([
  'more',
  'extra',
  'additional',
  'aur',
  'total',
  'working',
  'business',
  'full',
  'alag',
  'different',
  'new',
  'free',
  'small',
  'big',
  'major',
  'minor',
]);
const UNIT_NOUNS = new Set([
  'hour',
  'hr',
  'ghanta',
  'ghante',
  'day',
  'din',
  'month',
  'mahina',
  'mahine',
]);
const MONTHS = new Set(
  'jan january feb february mar march apr april may jun june jul july aug august sep sept september oct october nov november dec december'.split(
    ' ',
  ),
);
const TIME_WORDS = new Set(['am', 'pm', 'baje', 'bje', 'bajey', 'oclock']);
const ORDINALS = new Set(['st', 'nd', 'rd', 'th']);
const YEAR_PREV = new Set(['in', 'since', 'by', 'till', 'until', 'year', 'saal', 'san', 'from']);

const SENTENCE_END = /[!?\n]/;
const sentenceStart = (text: string, pos: number): number => {
  for (let k = pos - 1; k >= 0; k--) {
    const c = text[k] ?? '';
    if (SENTENCE_END.test(c)) return k + 1;
    if (
      c === '.' &&
      !/\d/.test(text[k + 1] ?? '') &&
      !/rs$/i.test(text.slice(k >= 2 ? k - 2 : 0, k))
    )
      return k + 1;
  }
  return 0;
};

const BREAK_RE =
  /[,;:]|\b(?:but|lekin|par|magar|however|instead|balki|whereas|though|although|then|toh|and|aur|plus)\b/gi;
const afterBreak = (s: string) => {
  let cut = 0;
  for (const m of s.matchAll(BREAK_RE)) cut = (m.index ?? 0) + m[0].length;
  return s.slice(cut);
};
const AFTER_STOP = /[.!?\n,;]|\b(?:but|lekin|par|magar|however|instead|balki)\b/i;
const untilStop = (s: string) => {
  const m = AFTER_STOP.exec(s);
  return m ? s.slice(0, m.index) : s;
};

const REF_BEFORE =
  /(?:\b(?:you|u)\s+(?:have\s+|had\s+)?(?:quoted|said|asked(?:\s+for)?|mentioned|charged?|want(?:ed)?|proposed|sent|told(?:\s+(?:me|us))?|offered|are\s+asking(?:\s+for)?)\b|\byou['’]re\s+asking(?:\s+for)?\b|\b(?:your|ur)\s+(?:quote|quotation|price|rate|ask|asking\s+price|estimate|offer|fee|fees|charge|charges)\b|\bquoted\b|\b(?:aapne|tumne|aap\s+ne|ap\s+ne|tum\s+ne|aapka|apka|aapki|apki|tumhara|tumhari)\b)/i;
const YOU_BEFORE = /\b(?:aap|ap|tum|you|u)\b/i;
const REF_AFTER =
  /^\s*(?:[\w'’]+\s+){0,2}?(?:bola|bole|boli|bataya|batayi|kaha|quote\s+kiya|quote\s+kia|quoted|maanga|manga|maang|mang)\b/i;
const CEIL_BEFORE =
  /\b(?:more\s+than|above|beyond|over|exceed(?:ing)?|upar|higher\s+than|max(?:imum)?|up\s*to|at\s+most|only|just|sirf|bas)\s*$/i;
const CEIL_AFTER =
  /^\s*(?:(?:se|say|sey)\s+(?:zyada|jyada|jada|zada|zyaada|jyaada|upar|uppar|adhik|aage)\s+(?:nahi|nahin|nai|nhi|na)\b|tak\b|max\b|maximum\b|tops\b|at\s+most\b|hi\b|only\b|is\s+(?:my|our|the)\s+(?:max|limit|budget|ceiling)\b)/i;
const NEG_BEFORE =
  /\b(?:not|never|can['’]?t|cannot|can\s+not|won['’]?t|wont|unable\s+to|no\s+way)\b(?:\s+[\w'’]+){0,3}\s*$/i;
const NEG_AFTER =
  /^\s*(?:(?:[\w'’]+\s+)?(?:nahi|nahin|nai|nhi|mat)\b|(?:is|was|hai|tha|bhi|toh|to|is\s+way)?\s*(?:too|bahut|bohot|bahot|bhot|kaafi|kafi|zyada|jyada|jada|zada|a\s+lot|very\s+high|high|expensive|mehenga|mehnga|steep)\b)/i;
const HEDGE_BEFORE =
  /\b(?:around|about|approx\.?|approximately|roughly|lagbhag|takriban|kareeb|karib|qareeb|near(?:ly)?)\s*$/i;
const TILDE_BEFORE = /~\s*$/;
const APPROX_AFTER = /^\s*(?:-?\s*ish\b|odd\b|something\b|kuch\b)/i;

const PREFIX = String.raw`^\s*(?:\/-|rupees?|rs\.?|inr|rupa\w*)?\s*`;
const unitAfter = (s: string, strong: boolean): Unit | null => {
  const per = String.raw`(?:per|an?|every|prati|har|\/)\s*`;
  if (
    new RegExp(
      `${PREFIX}(?:${per}(?:hour|hr|hrs|h|ghanta|ghante)\\b|hourly\\b|(?:ghante|ghanta)\\s+k[aei]\\b)`,
      'i',
    ).test(s)
  )
    return 'hour';
  if (
    new RegExp(
      `${PREFIX}(?:${per}(?:day|din|diwas)\\b|daily\\b|roz\\b|rozana\\b|din\\s+k[aei]\\b)`,
      'i',
    ).test(s)
  )
    return 'day';
  if (
    new RegExp(
      `${PREFIX}(?:${per}(?:month|mo|mth|mahina|mahine|mahena|maheena)\\b|monthly\\b|mahine\\s+k[aei]\\b${strong ? String.raw`|pm\b|p\.m\.` : ''})`,
      'i',
    ).test(s)
  )
    return 'month';
  return null;
};
const UNIT_BEFORE: [RegExp, Unit][] = [
  [
    /\b(?:hourly|per\s+hour|ghante\s+k[aei]|har\s+ghante|prati\s+ghanta)\b[^.!?\n,]{0,20}$/i,
    'hour',
  ],
  [
    /\b(?:daily|per\s+day|din\s+k[aei]|roz\s+k[aei]|har\s+din|prati\s+din)\b[^.!?\n,]{0,20}$/i,
    'day',
  ],
  [/\b(?:monthly|per\s+month|mahine\s+k[aei]|har\s+mahine|retainer)\b[^.!?\n,]{0,20}$/i, 'month'],
];
const FIXED_WORDS = String.raw`(?:fixed|flat|total|overall|lump\s*sum|one[-\s]?time|all[-\s]?in(?:clusive)?|poora|pura|poore)`;
const FIXED_AFTER = new RegExp(String.raw`^[^.!?\n,]{0,20}\b${FIXED_WORDS}\b`, 'i');
const FIXED_BEFORE = new RegExp(String.raw`\b${FIXED_WORDS}\b[^.!?\n,]{0,20}$`, 'i');

const span = (text: string, start: number, end: number): Span => ({
  start,
  end,
  text: text.slice(start, end),
});

// ---------------------------------------------------------------------------------------------

/** Every amount in the message, in order, and the numbers read as not-a-price. */
export const findAmounts = (
  text: string,
): { candidates: AmountCandidate[]; ignored: IgnoredNumber[] } => {
  const toks = tokenize(text);
  const candidates: AmountCandidate[] = [];
  const ignored: IgnoredNumber[] = [];
  let prevEnd = 0;
  let i = 0;
  while (i < toks.length) {
    const e1 = expression(toks, i);
    if (!e1) {
      i++;
      continue;
    }
    // ---- range: "40-45k", "40k to 45k", "40 se 45 hazaar", "between 40 and 45k"
    let low = e1;
    let high: Expr | null = null;
    let end = e1.end;
    {
      const c = toks[e1.end];
      const between = toks[i - 1]?.w === 'between';
      const connector =
        c &&
        ((c.kind === 'sym' && ['-', '–', '—'].includes(c.raw)) ||
          (c.kind === 'word' &&
            (['to', 'se'].includes(c.w) || (between && ['and', 'aur'].includes(c.w)))));
      if (connector) {
        let k = e1.end + 1;
        while (
          toks[k] &&
          (toks[k]!.raw === '₹' || INR_BEFORE.has(toks[k]!.w) || toks[k]!.raw === '.')
        )
          k++;
        const e2 = expression(toks, k);
        if (e2 && !(e2.word && e2.topScale === null)) {
          if (e1.topScale === null && e2.topScale !== null) {
            low = { ...e1, rat: times(e1.rat, e2.topScale), topScale: e2.topScale, digits: null };
            high = e2;
          } else if (!(e1.word && e1.topScale === null)) {
            high = e2;
          }
          if (high) end = e2.end;
        }
      }
    }
    if (low.word && low.topScale === null && !INR_AFTER.has(toks[end]?.w ?? '')) {
      i = end; // a lone number word ("do", "one more") is not an amount
      continue;
    }

    const first = toks[low.start]!;
    const lastTok = toks[end - 1]!;
    const next = toks[end];
    const next2 = toks[end + 1];
    const prev = toks[low.start - 1];
    const scaled = low.topScale !== null;

    // ---- currency before ("₹", "Rs.", "INR", "$") and after ("rupees", "/-", "dollars")
    let currency: Currency | null = null;
    let spanStart = first.start;
    {
      let k = low.start - 1;
      if (toks[k]?.raw === '.' && toks[k - 1]?.w === 'rs') k--;
      else if (toks[k]?.raw === ':' && (toks[k - 1]?.w === 'rs' || toks[k - 1]?.w === 'inr')) k--;
      const t = toks[k];
      if (t) {
        if (t.raw === '₹' || INR_BEFORE.has(t.w)) currency = 'INR';
        else if (['$', '€', '£'].includes(t.raw) || OTHER_BEFORE.has(t.w)) currency = 'OTHER';
        if (currency) spanStart = t.start;
      }
    }
    let spanEnd = lastTok.end;
    let after = end;
    if (next && next.kind === 'word' && INR_AFTER.has(next.w)) {
      currency ??= 'INR';
      spanEnd = next.end;
      after = end + 1;
    } else if (next && next.kind === 'word' && OTHER_AFTER.has(next.w)) {
      currency = 'OTHER';
      spanEnd = next.end;
      after = end + 1;
    } else if (next?.raw === '/' && !next.gap && next2?.raw === '-' && !next2.gap) {
      currency ??= 'INR';
      spanEnd = next2.end;
      after = end + 2;
    }

    // ---- not prices
    const glued = (t: Tok | undefined) => t !== undefined && !t.gap;
    const reason = ((): IgnoredReason | null => {
      const single = low.digits && !high ? low.digits : null;
      if (
        prev?.kind === 'word' &&
        !first.gap &&
        !INR_BEFORE.has(prev.w) &&
        !OTHER_BEFORE.has(prev.w)
      )
        return 'code';
      if (single?.plainDigits && single.plainDigits.length >= 10) return 'phone';
      if (prev?.raw === '+' && !first.gap) return 'phone';
      if (next?.raw === '%') return 'percent';
      if (next && ['percent', 'percentage', 'pct', 'pratishat', 'takka'].includes(next.w))
        return 'percent';
      if (next?.raw === ':' && glued(next) && next2?.kind === 'num' && glued(next2)) return 'time';
      if (next?.raw === '/' && glued(next) && next2?.kind === 'num' && glued(next2)) return 'date';
      if (
        next?.raw === '-' &&
        high === null &&
        glued(next) &&
        next2?.kind === 'num' &&
        glued(next2)
      )
        return 'date';
      if (high && toks[end]?.raw === '-' && toks[end + 1]?.kind === 'num' && glued(toks[end + 1]))
        return 'date';
      if (currency === null) {
        // count / duration nouns: "2 pages", "3-4 days", "2 more revisions", "2 or 3 rounds"
        let k = end;
        if (toks[k]?.raw === '-') k++;
        if (COUNT_MODIFIERS.has(toks[k]?.w ?? '')) k++;
        if (
          ['or', 'ya', 'to', 'se', 'and', '-'].includes(toks[k]?.w ?? '') &&
          toks[k + 1]?.kind === 'num'
        ) {
          k += 2;
          if (COUNT_MODIFIERS.has(toks[k]?.w ?? '')) k++;
        }
        const noun = toks[k];
        if (noun && COUNT_NOUNS.has(noun.w)) {
          const isUnitKa =
            UNIT_NOUNS.has(noun.w) && /^k[aei]$/.test(toks[k + 1]?.w ?? '') && scaled;
          if (!isUnitKa) return 'count';
        }
        if (!scaled) {
          if (next && glued(next) && next.kind === 'word' && ORDINALS.has(next.w)) return 'date';
          if ((next && MONTHS.has(next.w)) || (prev && MONTHS.has(prev.w))) return 'date';
          if (next && TIME_WORDS.has(next.w)) return 'time';
          if (
            single?.plainDigits?.length === 4 &&
            BigInt(single.plainDigits) >= 1900n &&
            BigInt(single.plainDigits) <= 2099n &&
            prev &&
            YEAR_PREV.has(prev.w)
          )
            return 'year';
        }
      }
      if (
        next &&
        glued(next) &&
        next.kind === 'word' &&
        !/^ish$/i.test(next.raw) &&
        !INR_AFTER.has(next.w)
      )
        return 'code';
      return null;
    })();
    if (reason) {
      let k = after > end ? after : end;
      if (reason === 'time' || reason === 'date') {
        // consume the rest of "5:30", "12/11/2026", "12-11-2026"
        while (
          [':', '/', '-'].includes(toks[k]?.raw ?? '') &&
          glued(toks[k]) &&
          toks[k + 1]?.kind === 'num' &&
          glued(toks[k + 1])
        ) {
          spanEnd = toks[k + 1]!.end;
          k += 2;
        }
      }
      if (reason === 'phone') {
        // "+91 98765 43210": the rest of the number
        while (toks[k]?.kind === 'num' && /^\d+$/.test(toks[k]!.raw)) {
          spanEnd = toks[k]!.end;
          k++;
        }
      }
      ignored.push({ span: span(text, spanStart, spanEnd), reason });
      prevEnd = spanEnd;
      i = k;
      continue;
    }

    // ---- value
    const flags: AmountFlag[] = [];
    const whole = (r: Rat, isScaled: boolean): bigint | null => {
      if (r.n % r.d === 0n) return r.n / r.d;
      if (isScaled) {
        flags.push('inexact');
        return null;
      }
      flags.push('paise');
      return r.n / r.d;
    };
    let rupees = whole(low.rat, scaled);
    let rupeesHigh = high ? whole(high.rat, high.topScale !== null) : null;
    if (low.badGrouping || high?.badGrouping) flags.push('bad_grouping');
    if (rupees !== null && rupeesHigh !== null && rupees >= rupeesHigh) flags.push('range_order');

    // ---- windows for role, hedge and unit
    const ss = sentenceStart(text, spanStart);
    const winStart = ss > prevEnd ? ss : prevEnd;
    const before = afterBreak(text.slice(winStart, spanStart));
    const rawAfter = text.slice(spanEnd, spanEnd + 60);
    const afterText = untilStop(rawAfter);

    if (
      low.approx ||
      TILDE_BEFORE.test(before) ||
      APPROX_AFTER.test(afterText) ||
      /^ish$/i.test(next?.raw ?? '')
    )
      flags.push('approximate');
    const hedged = HEDGE_BEFORE.test(before);

    let unit: Unit = 'unspecified';
    const strongish = currency !== null || scaled || low.comma;
    const ua = unitAfter(untilStop(text.slice(spanEnd, spanEnd + 40)), strongish);
    const ub = UNIT_BEFORE.find(([re]) => re.test(text.slice(winStart, spanStart)))?.[1] ?? null;
    if (ua) unit = ua;
    else if (ub) unit = ub;
    else if (FIXED_AFTER.test(afterText) || FIXED_BEFORE.test(before)) unit = 'fixed';

    const strong = strongish || unit !== 'unspecified';
    if (!strong && rupees !== null && rupees < 1000n && rupeesHigh === null) {
      flags.push('bare_small');
      rupees = null;
    }
    if (currency === 'OTHER') {
      flags.push('not_inr');
      rupees = null;
      rupeesHigh = null;
    }

    let role: AmountRole = 'price';
    if (REF_BEFORE.test(before) || (REF_AFTER.test(afterText) && YOU_BEFORE.test(before)))
      role = 'reference';
    else if (CEIL_BEFORE.test(before) || CEIL_AFTER.test(afterText)) role = 'price';
    else if (NEG_BEFORE.test(before) || NEG_AFTER.test(afterText)) role = 'rejected';

    candidates.push({
      rupees,
      rupeesHigh,
      unit,
      currency: currency ?? 'INR',
      span: span(text, spanStart, spanEnd),
      role,
      strong,
      hedged,
      flags: [...new Set(flags)],
    });
    prevEnd = spanEnd;
    i = after > end ? after : end;
  }
  return { candidates, ignored };
};

/**
 * The client's price in a message (GUIDELINES §4): the client's own new price wins over a
 * reference to the freelancer's quote; numbers that are not prices are skipped; two different
 * client prices → the first, marked ambiguous. Fails closed: anything unsure is ambiguous.
 */
export const readAmount = (text: string): AmountReading => {
  const { candidates, ignored } = findAmounts(text);
  const prices = candidates.filter((c) => c.role === 'price');
  const strong = prices.filter((c) => c.strong);
  const pool = strong.length > 0 ? prices.filter((c) => c.strong || c.rupees !== null) : prices;
  const primary = pool[0];
  if (!primary)
    return {
      rupees: null,
      rupeesHigh: null,
      unit: null,
      currency: null,
      span: null,
      ambiguous: false,
      flags: [],
      candidates,
      ignored,
    };
  const key = (c: AmountCandidate) =>
    `${c.rupees}|${c.rupeesHigh}|${c.currency}|${c.rupees === null ? c.span.text : ''}`;
  const flags = [...primary.flags];
  if (new Set(pool.map(key)).size > 1) flags.push('competing');
  return {
    rupees: primary.rupees,
    rupeesHigh: primary.rupeesHigh,
    unit: primary.unit,
    currency: primary.currency,
    span: primary.span,
    ambiguous: flags.length > 0,
    flags,
    candidates,
    ignored,
  };
};
