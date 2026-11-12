import { computeLadder, type LadderOk } from '@molbhav/engine';
import type { Move, Objection, Unit } from '@molbhav/analyser/labels';
import type { ConditionId, PlanInput } from '../src/types.ts';

/** the illustration in 13 §3.6: floor ₹38,000, target ₹45,600, opening ₹52,500 (made up) */
export const EXAMPLE = {
  u: 'fixed',
  eu: 'day',
  e: '7',
  K: '18',
  M: '90000',
  C: '3000',
  t: '20',
  a: '15',
} as const;

export const ladderOf = (x: Record<string, string> = EXAMPLE): LadderOk => {
  const r = computeLadder(x);
  if (!r.ok) throw new Error(`fixture ladder invalid: ${r.error}`);
  return r;
};

export interface Mk {
  ladder?: LadderOk;
  move?: Move | null;
  objection?: Objection | null;
  amount?: bigint | null;
  unit?: Unit | null;
  currency?: 'INR' | 'OTHER' | null;
  source?: 'analyser' | 'manual';
  confidence?: number | null;
  quote?: bigint | null;
  quoteSent?: boolean | null;
  condition?: ConditionId | null;
  advancePct?: 25n | 50n;
  reducedEffort?: string | null;
}

export const mk = (o: Mk = {}): PlanInput => {
  const ladder = o.ladder ?? ladderOf();
  return {
    ladder,
    deal: {
      quoteSent: o.quoteSent ?? (o.quote !== undefined && o.quote !== null ? true : null),
      currentQuote: o.quote ?? null,
    },
    client: {
      move: o.move === undefined ? 'PUSHBACK' : o.move,
      objection: o.objection === undefined ? null : o.objection,
      amount: o.amount === undefined ? null : o.amount,
      amountUnit: o.unit === undefined ? ladder.unit : o.unit,
      amountCurrency: o.currency === undefined ? 'INR' : o.currency,
      source: o.source ?? 'manual',
      confidence: o.confidence ?? null,
    },
    prefs: {
      condition: o.condition ?? null,
      advancePct: o.advancePct ?? 50n,
      reducedEffort: o.reducedEffort ?? null,
    },
  };
};
