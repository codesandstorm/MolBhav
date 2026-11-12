/**
 * Glue between the reader (S4b), the planner (S5) and the drafts (S6). Pure functions, no state.
 *
 * planInputFrom reads only the reader's enumerated results and the amount, never the message:
 * the client's text stays on the reader screen, in memory. A draft request (S6 input) is built
 * from a plan option and holds enumerated fields and engine numbers only (packages/planner
 * draft.ts: DraftRequest has no free-text field).
 */
import type { LadderOk } from '@molbhav/engine';
import type { Analysis } from '@molbhav/analyser';
import {
  allowedPercents,
  fillTemplate,
  type AllowedNumbers,
  type ConditionId,
  type DraftRequest,
  type Lang,
  type LadderUnit,
  type Plan,
  type PlanInput,
  type Tone,
} from '@molbhav/planner';
import type { ReaderState } from './screens/Reader.tsx';

/** what the reader passes on: its enumerated results, the amount and the quote answer */
export type ReaderResult = Pick<
  ReaderState,
  'quoteSent' | 'moveOverride' | 'objectionOverride' | 'amountText' | 'unitOverride' | 'status'
> & { analysis: Pick<Analysis, 'move' | 'confidence' | 'objection' | 'amount'> | null };

export interface ReplyPrefs {
  condition: ConditionId | null;
  advancePct: 25n | 50n;
  reducedEffort: string | null;
}
export const emptyPrefs: ReplyPrefs = { condition: null, advancePct: 50n, reducedEffort: null };

/** "4,50,000" or "450000" → 450000n; anything else → null (rule U-0) */
export const rupeesFrom = (s: string): bigint | null => {
  const c = s.replace(/[\s,₹]/g, '');
  if (!/^\d+$/.test(c)) return null;
  const v = BigInt(c);
  return v > 0n ? v : null;
};

export const currentQuote = (r: LadderOk): bigint | null =>
  r.quote && 'position' in r.quote ? r.floor + r.quote.differenceFromFloor : null;

export const planInputFrom = (
  reader: ReaderResult,
  ladder: LadderOk,
  prefs: ReplyPrefs,
): PlanInput => {
  const a = reader.analysis;
  const picked = reader.moveOverride !== null;
  const typed = reader.amountText !== null;
  const amount = typed ? rupeesFrom(reader.amountText!) : (a?.amount?.rupees ?? null);
  const notInr = !typed && (a?.amount?.flags ?? []).includes('not_inr');
  return {
    ladder,
    deal: {
      quoteSent: reader.quoteSent === 'unknown' ? null : reader.quoteSent === 'yes',
      currentQuote: currentQuote(ladder),
    },
    client: {
      move: reader.moveOverride ?? a?.move ?? null,
      objection:
        reader.objectionOverride === 'NONE'
          ? null
          : (reader.objectionOverride ?? a?.objection ?? null),
      amount,
      amountUnit: reader.unitOverride ?? a?.amount?.unit ?? null,
      amountCurrency: amount === null ? null : notInr ? 'OTHER' : 'INR',
      source: picked ? 'manual' : 'analyser',
      confidence: picked ? null : (a?.confidence ?? null),
    },
    prefs,
  };
};

/** every number any option of the plan may put in a draft: for a reply the user writes */
export const allowedForPlan = (plan: Plan, prefs: ReplyPrefs): AllowedNumbers => {
  const seen = new Set<bigint>();
  const prices: AllowedNumbers['prices'] = [];
  const percents = new Set<bigint>();
  for (const o of plan.options) {
    for (const a of o.allowed)
      if (!seen.has(a.rupees)) {
        seen.add(a.rupees);
        prices.push({ rupees: a.rupees, unit: a.unit });
      }
    for (const p of allowedPercents(o, prefs.advancePct)) percents.add(p);
  }
  return { prices, percents: [...percents] };
};

/** a ladder's identity: a saved reply is kept only while the ladder it came from is unchanged */
export const ladderKey = (r: LadderOk): string =>
  `${r.unit}:${r.floor}:${r.target}:${r.opening}:${currentQuote(r) ?? ''}`;

/** S6 state, saved with the deal in IndexedDB. No client text: the request is enumerated. */
export interface StoredReply {
  ladderKey: string;
  /** null when the user writes their own reply */
  request: DraftRequest | null;
  allowed: AllowedNumbers;
  prefs: ReplyPrefs;
  text: string;
  edited: boolean;
  savedAt: number;
}

/** the user's S6 choices applied to a request: language, tone, the trade's return and share */
export const withChoices = (
  r: DraftRequest,
  c: { lang: Lang; tone: Tone; condition: ConditionId | null; advancePct: 25n | 50n },
): DraftRequest => {
  const { advance_pct: _drop, ...numbers } = r.numbers;
  void _drop;
  const condition = r.kind === 'TRADE' ? (c.condition ?? r.condition) : null;
  return {
    ...r,
    lang: c.lang,
    tone: c.tone,
    condition,
    numbers: condition === 'ADVANCE' ? { ...numbers, advance_pct: c.advancePct } : numbers,
  };
};

/** the template draft for a request, or empty text when it cannot be built (fails closed) */
export const templateText = (r: DraftRequest): string => {
  const d = fillTemplate(r);
  return d.ok ? d.text : '';
};

export const ladderUnit = (r: LadderOk): LadderUnit => r.unit;
