/**
 * S5 response planner: the decision table in docs/product/18_planner_rules.md, as code. Pure and
 * deterministic: no I/O, no randomness, no floats. Every rupee figure comes from the engine's
 * ladder, from exact bigint arithmetic on it (steps.ts), from the engine re-run on a smaller
 * effort the user typed (rule D-1), or from the client's amount the user confirmed.
 */
import { computeLadder, Rational, type ExactInputs } from '@molbhav/engine';
import { LOW_CONFIDENCE, type Objection } from '@molbhav/analyser/labels';
import { stepCounter, tradeCounter } from './steps.ts';
import {
  FAMILY,
  type AllowedPrice,
  type ConditionId,
  type OptionKind,
  type Plan,
  type PlanInput,
  type PlanNote,
  type PlanOption,
  type Position,
  type ScopeState,
} from './types.ts';

export const PLANNER_VERSION = 'planner 0.1 (18_planner_rules.md v0.1)';

/** O-3 · the return the planner recommends for a trade when the user has not picked one */
export const recommendedCondition = (o: Objection | null): ConditionId =>
  o === 'PAYMENT_TERMS' || o === 'TRUST'
    ? 'MILESTONES'
    : o === 'SCOPE'
      ? 'SCOPE_REDUCE'
      : 'ADVANCE';

/** P-1 to P-3 · the price the options start from */
export const referencePrice = (
  floor: bigint,
  target: bigint,
  opening: bigint,
  quote: bigint | null,
): { price: bigint; source: Plan['priceSource']; notes: PlanNote[] } => {
  if (quote === null) return { price: opening, source: 'opening', notes: [] };
  if (quote >= floor) return { price: quote, source: 'quote', notes: [] };
  return { price: target, source: 'target', notes: ['quote_below_floor'] };
};

/** U-1, C-1 · the client's amount, if it can be compared with the ladder */
export const usableAmount = (input: PlanInput): { amount: bigint | null; notes: PlanNote[] } => {
  const c = input.client;
  if (c.amount === null || c.amount <= 0n) return { amount: null, notes: ['no_amount'] };
  if (c.amountCurrency === 'OTHER') return { amount: null, notes: ['not_inr'] };
  const u = c.amountUnit;
  if (u === null || u === 'unspecified') return { amount: c.amount, notes: ['unit_assumed'] };
  if (u === input.ladder.unit) return { amount: c.amount, notes: [] };
  return { amount: null, notes: ['unit_mismatch'] };
};

/** where the client's number sits against your floor, target and your price */
export const positionOf = (A: bigint | null, F: bigint, T: bigint, P: bigint): Position => {
  if (A === null) return 'none';
  if (A < F) return 'below_floor';
  if (A >= P) return 'at_or_above_price';
  if (A < T) return 'floor_to_target';
  return 'target_to_price';
};

const decimal = (r: Rational): string => r.toFixedHalfUp(2);

/** D-1 · re-price a smaller scope with the engine's own formula on the effort the user typed */
export const repriceScope = (
  inputs: ExactInputs,
  reduced: string | null,
  client: bigint | null,
): ScopeState => {
  if (reduced === null || reduced.trim() === '') return { status: 'needs_effort' };
  const e = Rational.parse(reduced.trim());
  if (e === null) return { status: 'invalid', error: 'not_a_number' };
  if (inputs.e === undefined || e.cmp(inputs.e) >= 0)
    return { status: 'invalid', error: 'not_smaller' };
  const r = computeLadder({
    u: inputs.u,
    eu: inputs.eu,
    e: reduced.trim(),
    K: decimal(inputs.K),
    M: inputs.M.n.toString(),
    C: inputs.C.n.toString(),
    b: inputs.b.toString(),
    t: inputs.t.toString(),
    a: inputs.a.toString(),
  });
  if (!r.ok) return { status: 'invalid', error: 'engine_rejected' };
  // S-4 / F-1: the client's number when it sits on the smaller ladder, else its target, else its
  // opening; never at or below the smaller scope's floor unless it is the client's own number
  const candidates: bigint[] = [];
  if (client !== null && client >= r.target && client <= r.opening) candidates.push(client);
  candidates.push(r.target, r.opening);
  const price = candidates.find((p) => p > r.floor || p === client);
  if (price === undefined) return { status: 'invalid', error: 'engine_rejected' };
  return {
    status: 'ready',
    figures: {
      effort: reduced.trim(),
      floor: r.floor,
      target: r.target,
      opening: r.opening,
      price,
    },
  };
};

const RANK_BASE: Record<string, OptionKind[]> = {
  'L-1': ['TRADE', 'HOLD', 'ASK'],
  'M-1': ['CONFIRM', 'CLARIFY'],
  'M-2': ['TRADE', 'HOLD', 'MEET', 'STEP'],
  'M-3': ['TRADE', 'HOLD', 'SCOPE', 'STEP'],
  'M-4': ['DECLINE', 'SCOPE', 'TRADE'],
  'M-5': ['TRADE', 'HOLD', 'ASK'],
  'M-6': ['ANSWER', 'ANSWER_HOLD'],
  'M-7': ['CONFIRM', 'CLARIFY'],
  'M-8': ['CLARIFY', 'HOLD'],
};

/** O-1, O-2 · objection modifiers on the order */
const applyObjection = (row: string, kinds: OptionKind[], o: Objection | null): OptionKind[] => {
  let k = [...kinds];
  const toFront = (x: OptionKind) => {
    if (k.includes(x)) k = [x, ...k.filter((y) => y !== x)];
  };
  if ((o === 'SCOPE' || o === 'COMPETITOR') && ['L-1', 'M-2', 'M-3', 'M-5'].includes(row))
    toFront('HOLD');
  if (o === 'BUDGET') {
    if (row === 'M-3') k = ['TRADE', 'SCOPE', 'HOLD', 'STEP'];
    if (row === 'M-5') k = [...k, 'SCOPE'];
  }
  return k;
};

export const planReplies = (input: PlanInput): Plan => {
  const { ladder: l, client: c, prefs } = input;
  const F = l.floor;
  const T = l.target;
  const s = l.step;
  const ref = referencePrice(F, T, l.opening, input.deal.currentQuote);
  const P = ref.price;
  const notes: PlanNote[] = [...ref.notes];
  const am = usableAmount(input);
  notes.push(...am.notes);
  let A = am.amount;
  let position = positionOf(A, F, T, P);

  // row selection (L-1, M-1 … M-8)
  let row: string;
  const low = c.source === 'analyser' && (c.move === null || (c.confidence ?? 0) < LOW_CONFIDENCE);
  if (low) {
    row = 'L-1';
    notes.push(c.move === null ? 'no_move' : 'low_confidence');
  } else if (c.move === 'INFO_REQUEST') row = 'M-6';
  else if (c.move === 'OTHER') row = 'M-8';
  else if (c.move === 'ACCEPT' && (A === null || A >= P)) row = 'M-7';
  else {
    if (c.move === 'ACCEPT') notes.push('accept_with_lower_amount');
    row =
      position === 'at_or_above_price'
        ? 'M-1'
        : position === 'target_to_price'
          ? 'M-2'
          : position === 'floor_to_target'
            ? 'M-3'
            : position === 'below_floor'
              ? 'M-4'
              : 'M-5';
  }
  // L-1 keeps the amount only to show it: options built on a guess never meet or decline a number
  if (row === 'L-1') {
    A = null;
    position = 'none';
  }

  // F-1: a client-facing price may equal the floor only when it is the user's own sent quote
  // or the client's own number
  const yourPriceOk = P > F || ref.source === 'quote';
  const condition = prefs.condition ?? recommendedCondition(c.objection);
  const pcts = condition === 'ADVANCE' ? [prefs.advancePct] : [];
  const tc = tradeCounter(P, T, s);
  const sc = stepCounter(P, T, s);
  const meetOk = A !== null && A >= T && A < P && (sc === null || A >= sc);
  if (tc === null && sc === null) notes.push('no_room');

  const price = (slot: AllowedPrice['slot'], rupees: bigint): AllowedPrice => ({
    slot,
    rupees,
    unit: l.unit,
  });
  const base = (kind: OptionKind, reason: string, risk: string): PlanOption => ({
    id: kind,
    kind,
    family: FAMILY[kind],
    rank: 0,
    rule: row,
    reason,
    risk,
    conditional: false,
    unconditionalConcession: false,
    figures: {
      yourPrice: null,
      counter: null,
      stepDown: null,
      clientPrice: null,
      agreed: null,
      floorReminder: F,
      scope: null,
    },
    condition: null,
    allowed: [],
    slots: [],
  });

  const build = (kind: OptionKind): PlanOption | null => {
    const o = c.objection;
    switch (kind) {
      case 'HOLD': {
        if (!yourPriceOk) return null;
        const reason =
          o === 'COMPETITOR'
            ? 'reason.HOLD.competitor'
            : o === 'SCOPE'
              ? 'reason.HOLD.scope'
              : row === 'M-8'
                ? 'reason.HOLD.other'
                : 'reason.HOLD.default';
        const x = base('HOLD', reason, 'risk.HOLD');
        x.figures.yourPrice = P;
        x.allowed = [price('your_price', P)];
        x.slots = ['your_price', 'edit'];
        return x;
      }
      case 'TRADE': {
        if (tc === null || !yourPriceOk) return null;
        const counter = A !== null && A >= tc && A < P ? A : tc;
        if (counter <= F && counter !== A) return null;
        const x = base('TRADE', 'reason.TRADE', 'risk.TRADE');
        x.conditional = true;
        x.condition = condition;
        x.figures.yourPrice = P;
        x.figures.counter = counter;
        x.figures.stepDown = P - counter;
        x.figures.clientPrice = counter === A ? A : null;
        x.allowed = [price('counter_price', counter), price('your_price', P)];
        x.slots = [
          'counter_price',
          'your_price',
          'condition',
          ...(pcts.length ? ['advance_pct'] : []),
        ];
        return x;
      }
      case 'STEP': {
        if (sc === null || meetOk || sc <= F) return null;
        const x = base('STEP', 'reason.STEP', 'risk.STEP');
        x.unconditionalConcession = true;
        x.figures.yourPrice = P;
        x.figures.counter = sc;
        x.figures.stepDown = P - sc;
        x.allowed = [price('counter_price', sc)];
        x.slots = ['counter_price'];
        return x;
      }
      case 'MEET': {
        if (!meetOk || A === null) return null;
        const x = base('MEET', 'reason.MEET', 'risk.MEET');
        x.unconditionalConcession = true;
        x.figures.yourPrice = P;
        x.figures.counter = A;
        x.figures.stepDown = P - A;
        x.figures.clientPrice = A;
        x.allowed = [price('client_price', A)];
        x.slots = ['client_price'];
        return x;
      }
      case 'SCOPE': {
        if (l.unit === 'hour' || !yourPriceOk) return null;
        const scope = repriceScope(l.inputs, prefs.reducedEffort, A);
        const x = base('SCOPE', 'reason.SCOPE', 'risk.SCOPE');
        x.figures.yourPrice = P;
        x.figures.clientPrice = A;
        x.figures.scope = scope;
        x.allowed =
          scope.status === 'ready'
            ? [price('scope_price', scope.figures.price), price('your_price', P)]
            : [];
        x.slots = ['scope_price', 'your_price', 'edit'];
        return x;
      }
      case 'DECLINE': {
        if (A === null) return null;
        const x = base('DECLINE', 'reason.DECLINE', 'risk.DECLINE');
        x.figures.clientPrice = A;
        x.allowed = [price('client_price', A)];
        x.slots = ['client_price'];
        return x;
      }
      case 'CONFIRM': {
        const agreed = A !== null && A >= P ? A : P;
        if (agreed === F && agreed !== A && ref.source !== 'quote') return null;
        const x = base('CONFIRM', 'reason.CONFIRM', 'risk.CONFIRM');
        x.figures.agreed = agreed;
        x.figures.clientPrice = A;
        x.allowed = [price('agreed_price', agreed)];
        x.slots = ['agreed_price', 'edit'];
        return x;
      }
      case 'ANSWER_HOLD': {
        if (!yourPriceOk) return null;
        const x = base('ANSWER_HOLD', 'reason.ANSWER_HOLD', 'risk.ANSWER_HOLD');
        x.figures.yourPrice = P;
        x.allowed = [price('your_price', P)];
        x.slots = ['your_price', 'edit'];
        return x;
      }
      case 'ASK':
        return { ...base('ASK', 'reason.ASK', 'risk.ASK'), slots: [] };
      case 'ANSWER':
        return { ...base('ANSWER', 'reason.ANSWER', 'risk.ANSWER'), slots: ['edit'] };
      case 'CLARIFY':
        return { ...base('CLARIFY', 'reason.CLARIFY', 'risk.CLARIFY'), slots: ['edit'] };
    }
  };

  const wanted = applyObjection(row, RANK_BASE[row] ?? [], c.objection);
  let options = wanted.map(build).filter((x): x is PlanOption => x !== null);
  // N-1: always 2 to 4 options; fill with the number-free replies
  for (const k of ['ASK', 'CLARIFY'] as const) {
    if (options.length >= 2) break;
    if (!options.some((x) => x.kind === k)) options.push(build(k)!);
  }
  options = options.slice(0, 4);
  // G-1: the first option is never a price cut with nothing asked back
  const firstSafe = options.findIndex((x) => !x.unconditionalConcession);
  if (firstSafe > 0) options = [options[firstSafe]!, ...options.filter((_, i) => i !== firstSafe)];
  options.forEach((x, i) => (x.rank = i + 1));

  return {
    yourPrice: P,
    priceSource: ref.source,
    position,
    clientPrice: A,
    row,
    options,
    notes: [...new Set(notes)],
  };
};

/** the percentages an option may put in a draft (the advance share the user picked) */
export const allowedPercents = (o: PlanOption, advancePct: bigint): bigint[] =>
  o.kind === 'TRADE' && o.condition === 'ADVANCE' ? [advancePct] : [];
