/**
 * Rule baseline for reading a client message (S4b), written from ml/gold/GUIDELINES.md v0.2
 * (§1 moves, §3 objections, §5 rule-decided parts) before any gold message exists. The rules
 * that depend on the quote (J5, J7) read it from the deal state they are given, the same fact
 * the blind labeller sees (GUIDELINES §0); they never guess it from the text. Weights and
 * the low-confidence threshold are first guesses [HYPOTHESIS]; they may later be tuned on the
 * dev split only, never on test (docs/product/04_research_integrity.md §2).
 *
 * Deterministic and pure: the same text and deal state give the same result. Every move,
 * objection and conditional it returns carries the evidence phrases that produced it; with
 * no evidence it returns null and the user picks by hand (A9).
 */
import { readAmount, type AmountReading } from './amount.ts';
import { MOVES, OBJECTIONS, type Move, type Objection } from './labels.ts';

export const RULES_VERSION = 'rules 0.2 (GUIDELINES v0.2)';

/** The deal state the rules need (GUIDELINES §5.1): has the freelancer sent a quote? null = not known. */
export interface DealState {
  quoteSent: boolean | null;
}

export type Supports = Move | Objection | 'conditional';

export interface Evidence {
  phrase: string;
  start: number;
  end: number;
  supports: Supports;
  weight: number;
  /** which rule fired, for the evidence list and the tests */
  rule: string;
}

export interface Analysis {
  move: Move | null;
  /** margin between the top two move scores, in [0, 1]; 0 when there is no evidence */
  confidence: number;
  /** PRICE_POSITION only, from deal state (GUIDELINES §5.1); null when not applicable or unknown */
  anchorOrCounter: 'ANCHOR' | 'COUNTER' | null;
  objection: Objection | null;
  objectionConfidence: number;
  /** CONCESSION only (GUIDELINES §5.2) */
  conditional: boolean | null;
  amount: AmountReading;
  scores: Record<Move, number>;
  evidence: Evidence[];
  source: 'rules';
  version: string;
}

interface Rule {
  id: string;
  re: RegExp;
  supports: Supports;
  weight: number;
  /** skip a match preceded by a negation ("not agreed", "no deal") */
  negatable?: boolean;
}

const r = (
  id: string,
  supports: Supports,
  weight: number,
  re: RegExp,
  negatable = false,
): Rule => ({
  id,
  supports,
  weight,
  re: new RegExp(re.source, 'gi'),
  negatable,
});

// Spelling variants (09 §5: "normalise common Roman-Hindi spelling variants")
const ZYADA = String.raw`(?:zyada|jyada|jada|zada|zyaada|jyaada|ziada)`;
const NAHI = String.raw`(?:nahi|nahin|nai|nhi|nahee)`;
const KAM = String.raw`(?:kam|kum)`;
const KITNA = String.raw`(?:kitna|kitni|kitne|kitna)`;
const re = (s: string, flags = '') => new RegExp(s, flags);

const RULES: Rule[] = [
  // ---- PRICE_POSITION: states a price (via the amount parser, below) or asks for one (§1)
  r(
    'ask-best-price',
    'PRICE_POSITION',
    2,
    /\b(?:best|final|last|lowest|your|aapka|apka)\s+(?:price|rate|quote|offer|number|figure|charges?)\b/,
  ),
  r('ask-how-much', 'PRICE_POSITION', 2, /\bhow\s+much\b/),
  r(
    'ask-what-price',
    'PRICE_POSITION',
    2,
    /\bwhat(?:['’]s|\s+is|\s+will\s+be|\s+would\s+be)?\s+(?:the\s+|your\s+)?(?:price|cost|rate|charges?|quote|fee|fees)\b/,
  ),
  r(
    'ask-kitna',
    'PRICE_POSITION',
    2,
    re(
      String.raw`\b${KITNA}\s+(?:ka|ki|ke|paise|paisa|rupees|rupaye|charge|price|rate|cost|lagega|loge|lenge|hoga|dena|dene|budget)\b`,
    ),
  ),
  r(
    'ask-price-kya',
    'PRICE_POSITION',
    2,
    re(String.raw`\b(?:price|rate|cost|charges?|quote|budget)\s+(?:kya|${KITNA})\b`),
  ),
  r(
    'ask-send-quote',
    'PRICE_POSITION',
    2,
    /\b(?:send|share)\s+(?:me\s+|us\s+)?(?:a\s+|the\s+|your\s+)?(?:quote|quotation|estimate|pricing)\b/,
  ),
  r(
    'ask-quote-bhejo',
    'PRICE_POSITION',
    2,
    /\b(?:quote|quotation|estimate)\s+(?:bhejo|bhej\s+do|dijiye|do)\b/,
  ),

  // ---- PUSHBACK: rejects or objects, no new number (§1)
  r('too-high', 'PUSHBACK', 2, /\btoo\s+(?:high|much|expensive|costly|steep|pricey)\b/),
  r(
    'more-than-expected',
    'PUSHBACK',
    2,
    /\b(?:way|bit|little|lot|much)\s+(?:more|higher)\s+than\b/,
  ),
  r('bit-much', 'PUSHBACK', 2, /\b(?:a\s+)?bit\s+(?:much|high|steep)\b/),
  r(
    'itna-zyada',
    'PUSHBACK',
    2,
    re(
      String.raw`\b(?:itna|itni|itne|bahut|bohot|bahot|bhot|kaafi|kafi|thoda)\s+(?:${ZYADA}|mehenga|mehnga|high)\b`,
    ),
  ),
  r('expensive', 'PUSHBACK', 2, /\b(?:expensive|costly|overpriced|meh?enga|mehnga)\b/),
  r(
    'kam-karo',
    'PUSHBACK',
    2,
    re(
      String.raw`\b${KAM}\s+(?:karo|kardo|kar\s+do|kijiye|kariye|ho\s+sakta|hoga|karna|kar\s+sakte|kar\s+dijiye)\b`,
    ),
  ),
  r(
    'reduce',
    'PUSHBACK',
    2,
    /\b(?:reduce|lower\s+(?:it|the\s+price)|bring\s+(?:it\s+)?down|come\s+down|discount|cheaper)\b/,
  ),
  r('not-possible', 'PUSHBACK', 2, /\bnot\s+(?:possible|feasible|affordable|worth\s+it)\b/),
  r('cant-afford', 'PUSHBACK', 2, /\bcan['’]?t\s+afford\b|\bcannot\s+afford\b/),
  r(
    'out-of-budget',
    'PUSHBACK',
    2,
    re(
      String.raw`\bout\s+of\s+(?:our\s+|my\s+|the\s+)?budget\b|\bbudget\s+(?:se\s+)?(?:bahar|${ZYADA}|${NAHI})\b|\bover\s+(?:our|my|the)\s+budget\b`,
    ),
  ),
  r(
    'nahi-hoga',
    'PUSHBACK',
    2,
    re(String.raw`\b${NAHI}\s+(?:ho\s+payega|hoga|chalega|de\s+payenge|de\s+sakte|afford)\b`),
  ),
  r(
    'why-so-high',
    'PUSHBACK',
    2,
    re(
      String.raw`\bwhy\s+(?:is\s+it\s+|so\s+|this\s+)?(?:so\s+)?(?:high|much|expensive|costly)\b|\b(?:itna|itne|itni)\s+(?:kyun|kyon|kyu)\b`,
    ),
  ),
  r(
    'others-charge-less',
    'PUSHBACK',
    2,
    /\b(?:others?|other\s+people|someone|log|baaki|dusr[ae]|doosr[ae])\b[^.?!]{0,30}\b(?:charg\w*|less|cheaper|kam|sast[ae]|half)\b/,
  ),

  // ---- CONCESSION: movement towards the freelancer (§1)
  r(
    'i-can-stretch',
    'CONCESSION',
    3,
    /\b(?:i|we)\s+(?:can|could|will|['’]ll)\s+(?:stretch|go\s+up|increase|raise|move\s+up|add|extend|manage|adjust|do\s+a\s+bit\s+more)\b/,
    true,
  ),
  r('stretch-to', 'CONCESSION', 2, /\b(?:stretch|go\s+up|move\s+up)\s+(?:to|till|upto)\b/, true),
  r(
    'halfway',
    'CONCESSION',
    2,
    /\b(?:meet\s+(?:you\s+)?(?:half\s*way|in\s+the\s+middle)|halfway|beech\s+(?:ka|mein|me))\b/,
  ),
  r('chalo', 'CONCESSION', 2, /\bchalo\b/),
  r(
    'de-denge',
    'CONCESSION',
    2,
    /\b(?:de|kar|badha|bada)\s+(?:denge|dete\s+hain|dete\s+he|dunga|dungi|dege|sakte\s+hain)\b/,
    true,
  ),
  r(
    'skip-part',
    'CONCESSION',
    2,
    /\b(?:we\s+can|let['’]?s|you\s+can)\s+(?:skip|drop|remove|leave\s+out)\b|\b(?:skip|drop|hata)\s+(?:kar\s+do|kar\s+dete|dete\s+hain|denge)\b/,
  ),
  r(
    'take-more-time',
    'CONCESSION',
    2,
    /\b(?:you\s+can\s+take|take)\s+(?:a\s+few\s+|two\s+|2\s+|some\s+)?(?:more|extra)\s+(?:days?|time|weeks?)\b|\b(?:extra|aur)\s+(?:time|din|days)\s+(?:le\s+lo|chalega|is\s+fine|ok)\b/,
  ),
  r(
    'raise-offer',
    'CONCESSION',
    2,
    /\b(?:raise|increase|up)\s+(?:our|my|the)\s+(?:offer|budget)\b/,
  ),
  r('adjust-kar-lenge', 'CONCESSION', 2, /\badjust\s+kar\s+(?:lenge|lete|denge|sakte)\b/),
  r('ok-opener', 'CONCESSION', 1, /^\s*(?:ok(?:ay)?|fine|alright|theek\s+hai|thik\s+hai)\s*[,.!]/),
  r(
    'ok-then',
    'CONCESSION',
    2,
    /\b(?:ok|okay|fine|alright|theek\s+hai|thik\s+hai)\b[^.?!]{0,25}\bthen\b/,
  ),

  // ---- ACCEPT: agrees without new conditions (§1)
  r('sounds-good', 'ACCEPT', 3, /\b(?:sounds|looks)\s+(?:good|great|fine|perfect)\b/, true),
  r(
    'go-ahead',
    'ACCEPT',
    3,
    /\b(?:go\s+ahead|let['’]?s\s+(?:go|start|begin|do\s+it|proceed|finali[sz]e)|please\s+(?:start|proceed|begin))\b/,
    true,
  ),
  r(
    'deal-done',
    'ACCEPT',
    3,
    /\b(?:deal|done|agreed?|confirmed?|approved?|finali[sz]ed|pakka|final\s+hai|done\s+hai)\b/,
    true,
  ),
  r(
    'invoice',
    'ACCEPT',
    3,
    /\b(?:send|share)\s+(?:me\s+|us\s+)?(?:the\s+|your\s+)?(?:invoice|bill|payment\s+details|account\s+details|upi)\b|\binvoice\s+(?:bhejo|bhej\s+do|send|share)\b/,
  ),
  r(
    'start-karo',
    'ACCEPT',
    3,
    /\b(?:start|shuru)\s+(?:karo|kar\s+do|kijiye|kariye|kar\s+dijiye|kar\s+sakte)\b/,
    true,
  ),
  r(
    'works-for-us',
    'ACCEPT',
    3,
    /\b(?:works|fine)\s+(?:for|by)\s+(?:me|us)\b|\bwe['’]?re\s+good\b/,
    true,
  ),
  r(
    'ok-yes',
    'ACCEPT',
    1,
    /\b(?:ok|okay|yes|yeah|yep|haan|ha|ji|theek\s+hai|thik\s+hai|chalega|perfect|great|cool)\b/,
    true,
  ),

  // ---- INFO_REQUEST: asks for facts, not a price (§1)
  r(
    'wh-question',
    'INFO_REQUEST',
    2,
    /\b(?:how\s+(?:many|long|soon|do|does|will|would)|what\s+(?:is\s+included|all|does|do|about|kind|type|tools?|platform|tech)|which|when|where|who|kitne\s+(?:din|revisions?|pages?|hafte|time|samay|log)|kab\s+tak|kab\b|kaise|kaun|kya\s+(?:aap|tum|isme|ismein|include|hosting|domain))\b/,
  ),
  r(
    'aux-question',
    'INFO_REQUEST',
    1,
    /\b(?:do|does|can|could|will|would|is|are)\s+(?:you|it|there|this|that|we)\b/,
  ),
  r(
    'share-work',
    'INFO_REQUEST',
    2,
    /\b(?:share|send|show|dikhao|bhejo)\s+(?:me\s+|us\s+)?(?:your\s+|some\s+|kuch\s+)?(?:portfolio|samples?|past\s+work|previous\s+work|references?|details|work)\b|\b(?:portfolio|samples?)\s+(?:dikhao|bhejo|share)\b/,
  ),
  r('question-mark', 'INFO_REQUEST', 1, /\?/),

  // ---- OTHER: greetings, thanks, delays, statements of fact (§1)
  r('thanks', 'OTHER', 1, /\b(?:thanks|thank\s+you|thx|ty|shukriya|dhanyavaad|dhanyawad)\b/),
  r('greeting', 'OTHER', 1, /\b(?:hi|hello|hey|namaste|good\s+(?:morning|evening|afternoon))\b/),
  r(
    'get-back',
    'OTHER',
    2,
    /\b(?:will|i['’]ll|we['’]ll|shall)\s+(?:get\s+back|revert|let\s+you\s+know|discuss|think|check|confirm|update)\b|\b(?:revert|get\s+back\s+to\s+you)\b/,
  ),
  r(
    'later',
    'OTHER',
    2,
    /\b(?:kal|baad\s+(?:mein|me)|later|tomorrow)\s+(?:baat|bataunga|bataenge|batata|batate|discuss|talk|confirm)\b|\b(?:busy|meeting\s+(?:mein|me))\b/,
  ),
  r(
    'discuss-with',
    'OTHER',
    2,
    /\b(?:discuss|check|talk)\s+(?:with|karke|karenge)\b|\blet\s+me\s+(?:think|check|discuss|confirm)\b/,
  ),

  // ---- objections (§3)
  r(
    'budget',
    'BUDGET',
    2,
    /\b(?:budget|afford|funds?|paisa\s+nahi|paise\s+nahi|tight|cash\s*flow)\b/,
  ),
  r(
    'price-high',
    'BUDGET',
    1,
    re(
      String.raw`\b(?:too\s+(?:high|much|expensive)|expensive|meh?enga|itna\s+${ZYADA}|bahut\s+${ZYADA})\b`,
    ),
  ),
  r(
    'competitor',
    'COMPETITOR',
    3,
    /\b(?:fiverr|upwork|freelancer\.com|other\s+(?:freelancers?|agenc(?:y|ies)|designers?|developers?|quotes?|guys?)|another\s+(?:freelancer|agency|designer|developer|quote|guy)|someone\s+(?:else|on)|dusr[ae]\s+(?:banda|log|wale|designer|developer|agency)|doosr[ae]\s+(?:banda|log|wale)|baaki\s+log|competitor|cheaper\s+(?:option|elsewhere)|got\s+(?:a\s+|other\s+)?quotes?|market\s+(?:rate|mein|me))\b/,
  ),
  r(
    'scope-small',
    'SCOPE',
    2,
    /\b(?:just|only|simple|basic|small|chhota|chota|sirf)\s+(?:a\s+)?(?:\w+\s+)?(?:site|page|website|landing|logo|app|design|kaam|project|work|change)\b/,
  ),
  r(
    'scope-more',
    'SCOPE',
    2,
    /\b(?:also\s+(?:include|add|do)|bhi\s+(?:daal|dal|kar|bana)\s*(?:do|dena|dijiye)|usi\s+(?:mein|me)|same\s+price|for\s+the\s+same|extra\s+(?:pages?|screens?|features?)\s+(?:included|bhi|free))\b/,
  ),
  r(
    'timeline',
    'TIMELINE',
    2,
    /\b(?:deadline|urgent(?:ly)?|asap|jaldi|quickly|by\s+(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday|tomorrow|next\s+week|end\s+of)|before\s+(?:diwali|holi|eid|christmas|launch|monday|friday)|kitne\s+din|kab\s+tak|how\s+long|time\s+(?:lagega|kyun|kyu)|itna\s+time|delay(?:ed)?|live\s+by)\b/,
  ),
  r(
    'payment-terms',
    'PAYMENT_TERMS',
    2,
    /\b(?:advance|upfront|up-front|milestones?|installments?|instalments?|after\s+delivery|kaam\s+ke\s+baad|payment\s+(?:terms|after|baad|later|in\s+parts)|net\s*30|half\s+now|part\s+payment|emi|pay\s+(?:after|later|on\s+delivery)|baad\s+(?:mein|me)\s+(?:payment|pay|denge))\b/,
  ),
  r(
    'trust',
    'TRUST',
    2,
    /\b(?:portfolio|samples?|past\s+work|previous\s+work|references?|reviews?|guarantee|how\s+do\s+(?:i|we)\s+know|trust|proof|bharos[ae]|bhros[ae]|risk|legit|genuine|refund)\b/,
  ),

  // ---- conditional cues on CONCESSION (§5.2)
  r(
    'cond-if',
    'conditional',
    1,
    /\b(?:only\s+if|if|provided(?:\s+that)?|as\s+long\s+as|on\s+(?:the\s+)?condition|in\s+exchange|in\s+return|agar|tabhi|toh\s+hi|to\s+hi|tab\s+hi|but\s+then|lekin\s+phir)\b/,
  ),
  r('cond-bas-chahiye', 'conditional', 1, /\bbas\b[^.?!]{0,40}\bchahiye\b/),
];

const NEGATION_BEFORE = re(
  String.raw`\b(?:not|no|never|isn['’]?t|aren['’]?t|don['’]?t|won['’]?t|can['’]?t|${NAHI})\s+(?:\w+\s+)?$`,
  'i',
);
const OBJECTION_ORDER: readonly Objection[] = [
  'BUDGET',
  'COMPETITOR',
  'SCOPE',
  'TIMELINE',
  'PAYMENT_TERMS',
  'TRUST',
];
/** GUIDELINES §1 tie-break ladder (J1) */
const MOVE_ORDER: readonly Move[] = [
  'ACCEPT',
  'CONCESSION',
  'PRICE_POSITION',
  'PUSHBACK',
  'INFO_REQUEST',
  'OTHER',
];
/**
 * Movement words that say on their own that the client is moving ("we can go up to …"). With
 * no quote sent, only these make a number a CONCESSION (J5); "ok", "chalo", "de denge" do not.
 */
const EXPLICIT_MOVEMENT = new Set(['i-can-stretch', 'stretch-to', 'raise-offer']);
/** a message of nothing but "ok" / "yes" / "theek hai" (J7) */
const BARE_OK =
  /^\s*(?:ok(?:ay)?|yes|yeah|yep|haan|ha|ji|theek\s+hai|thik\s+hai|chalega|done|sure)\s*[.!]*\s*$/i;

const isMoveSupport = (s: Supports): s is Move => (MOVES as readonly string[]).includes(s);
const isObjectionSupport = (s: Supports): s is Objection =>
  (OBJECTIONS as readonly string[]).includes(s);

/** confidence from the margin between the top two scores, in [0, 1) */
const marginConfidence = (top: number, second: number) =>
  top <= 0 ? 0 : (top - second) / (top + 1);

const pick = <K extends string>(scores: Record<K, number>, order: readonly K[]) => {
  const ranked = [...order].sort(
    (a, b) => scores[b] - scores[a] || order.indexOf(a) - order.indexOf(b),
  );
  const top = ranked[0]!;
  const second = ranked[1];
  return { top, topScore: scores[top], secondScore: second === undefined ? 0 : scores[second] };
};

/** Read one client message. Pure and deterministic. */
export const analyse = (text: string, state: DealState = { quoteSent: null }): Analysis => {
  const evidence: Evidence[] = [];
  const add = (e: Evidence) => evidence.push(e);

  for (const rule of RULES) {
    rule.re.lastIndex = 0;
    for (const m of text.matchAll(rule.re)) {
      const start = m.index ?? 0;
      if (rule.negatable && NEGATION_BEFORE.test(text.slice(start >= 24 ? start - 24 : 0, start)))
        continue;
      add({
        phrase: m[0],
        start,
        end: start + m[0].length,
        supports: rule.supports,
        weight: rule.weight,
        rule: rule.id,
      });
      break; // each rule counts once
    }
  }

  // ---- the amount parser: a client price on the table is PRICE_POSITION evidence (§1, J2)
  const amount = readAmount(text);
  const price = amount.candidates.find(
    (c) => c.role === 'price' && (c.strong || c.rupees !== null),
  );
  if (price)
    add({
      phrase: price.span.text,
      start: price.span.start,
      end: price.span.end,
      supports: 'PRICE_POSITION',
      weight: 3,
      rule: 'client-price',
    });
  const rejected = amount.candidates.find((c) => c.role === 'rejected');
  if (rejected)
    add({
      phrase: rejected.span.text,
      start: rejected.span.start,
      end: rejected.span.end,
      supports: 'PUSHBACK',
      weight: 1,
      rule: 'rejected-amount',
    });

  // ---- structural rules from the tie-breaks
  const has = (id: string) => evidence.some((e) => e.rule === id);
  const noQuote = state.quoteSent === false;
  // J5: a number with a movement word is CONCESSION, not PRICE_POSITION. With no quote sent
  // there is nothing to move towards unless the words say so, so only explicit movement counts.
  const movement = evidence.some(
    (e) => e.supports === 'CONCESSION' && (!noQuote || !price || EXPLICIT_MOVEMENT.has(e.rule)),
  );
  if (price && movement)
    add({
      phrase: price.span.text,
      start: price.span.start,
      end: price.span.end,
      supports: 'CONCESSION',
      weight: 2,
      rule: 'number-with-movement',
    });
  // J7: "ok" alone is ACCEPT after a quote; with no quote sent there is nothing to accept, so it
  // is OTHER (the labeller ticks unsure). Unknown deal state keeps the ACCEPT reading.
  const bareOk = BARE_OK.test(text);
  if (bareOk && (has('ok-yes') || has('deal-done'))) {
    const e = evidence.find((x) => x.rule === 'ok-yes' || x.rule === 'deal-done')!;
    add({
      ...e,
      supports: noQuote ? 'OTHER' : 'ACCEPT',
      weight: 2,
      rule: noQuote ? 'bare-ok-no-quote' : 'bare-ok',
    });
  }
  // a price question is not an information request (§1 INFO_REQUEST: "not what's the price")
  const priceAsk =
    price !== undefined ||
    evidence.some((e) => e.supports === 'PRICE_POSITION' && e.rule.startsWith('ask-'));
  // "ok, but …" is decided by what follows "but" (J7): a weak yes before a "but" yields to another move after it
  const but = /\b(?:but|lekin|par|magar)\b/i.exec(text);
  const otherMoveAfterBut =
    but !== null &&
    evidence.some(
      (e) => isMoveSupport(e.supports) && e.supports !== 'ACCEPT' && e.start > but.index,
    );

  const scores = Object.fromEntries(MOVES.map((m) => [m, 0])) as Record<Move, number>;
  const counted = new Set<Evidence>();
  for (const e of evidence) {
    if (!isMoveSupport(e.supports)) continue;
    if (
      priceAsk &&
      e.supports === 'INFO_REQUEST' &&
      (e.rule === 'question-mark' || e.rule === 'aux-question')
    )
      continue;
    // J2: a complaint with a client price on the table is PRICE_POSITION, not PUSHBACK
    if (price && !movement && e.supports === 'PUSHBACK') continue;
    // J5 with no quote sent: a number with only weak movement words stays PRICE_POSITION
    if (price && !movement && e.supports === 'CONCESSION') continue;
    // J7 with no quote sent: a bare "ok" is not an acceptance
    if (noQuote && bareOk && e.supports === 'ACCEPT') continue;
    // a weak yes before a "but" does not count when another move follows the "but" (J7)
    if (e.rule === 'ok-yes' && otherMoveAfterBut && but !== null && e.start < but.index) continue;
    scores[e.supports] += e.weight;
    counted.add(e);
  }

  const m = pick(scores, MOVE_ORDER);
  const move = m.topScore > 0 ? m.top : null;
  const confidence = move ? marginConfidence(m.topScore, m.secondScore) : 0;

  const objScores = Object.fromEntries(OBJECTIONS.map((o) => [o, 0])) as Record<Objection, number>;
  for (const e of evidence)
    if (isObjectionSupport(e.supports)) {
      objScores[e.supports] += e.weight;
      counted.add(e);
    }
  const o = pick(objScores, OBJECTION_ORDER);
  const objection = o.topScore > 0 ? o.top : null;
  const objectionConfidence = objection ? marginConfidence(o.topScore, o.secondScore) : 0;

  const conditional =
    move === 'CONCESSION' ? evidence.some((e) => e.supports === 'conditional') : null;
  const anchorOrCounter =
    move === 'PRICE_POSITION' && state.quoteSent !== null
      ? state.quoteSent
        ? 'COUNTER'
        : 'ANCHOR'
      : null;

  // keep only the evidence for what is returned, in text order
  const kept = evidence
    .filter(
      (e) =>
        (counted.has(e) && (e.supports === move || e.supports === objection)) ||
        (e.supports === 'conditional' && conditional === true),
    )
    .sort((a, b) => a.start - b.start || a.end - b.end);

  return {
    move,
    confidence,
    anchorOrCounter,
    objection,
    objectionConfidence,
    conditional,
    amount,
    scores,
    evidence: kept,
    source: 'rules',
    version: RULES_VERSION,
  };
};
