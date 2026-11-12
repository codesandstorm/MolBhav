import type { ExactInputs, Unit as LadderUnit } from '@molbhav/engine';
import type { Move, Objection, Unit as AmountUnit } from '@molbhav/analyser/labels';

export type { LadderUnit };

/** The ladder fields the planner reads (a subset of the engine's LadderOk). */
export interface PlanLadder {
  unit: LadderUnit;
  step: bigint;
  floor: bigint;
  target: bigint;
  opening: bigint;
  concessionRoomPct: bigint;
  /** the engine's validated inputs; needed only to re-price a smaller scope (rule D-1) */
  inputs: ExactInputs;
}

/** What the client did, from the analyser (ESTIMATE) or the manual picker (USER DECISION). */
export interface ClientMove {
  move: Move | null;
  objection: Objection | null;
  /** the client's price in whole rupees, as the user confirmed it on the reader screen */
  amount: bigint | null;
  amountUnit: AmountUnit | null;
  amountCurrency: 'INR' | 'OTHER' | null;
  /** 'manual' when the user picked the move themselves */
  source: 'analyser' | 'manual';
  /** the analyser's move confidence, null for a manual pick */
  confidence: number | null;
}

export interface DealState {
  /** has a quote been sent? null = not known */
  quoteSent: boolean | null;
  /** the price the user has on the table (their quote), whole rupees, same unit as the ladder */
  currentQuote: bigint | null;
}

export const CONDITIONS = [
  'ADVANCE',
  'MILESTONES',
  'SCOPE_REDUCE',
  'TIMELINE',
  'PORTFOLIO',
  'REFERRAL',
] as const;
export type ConditionId = (typeof CONDITIONS)[number];

/** the advance shares the user can pick (USER DECISION); a fixed list, so no free number */
export const ADVANCE_PCTS = [25n, 50n] as const;
export type AdvancePct = (typeof ADVANCE_PCTS)[number];

export interface Preferences {
  /** the return the user asks for in a trade (USER DECISION); null = use the recommended one */
  condition: ConditionId | null;
  advancePct: AdvancePct;
  /** the smaller effort for a scope cut, as typed (USER DECISION), in the ladder's effort unit */
  reducedEffort: string | null;
}

export interface PlanInput {
  ladder: PlanLadder;
  deal: DealState;
  client: ClientMove;
  prefs: Preferences;
}

export const OPTION_KINDS = [
  'HOLD',
  'TRADE',
  'STEP',
  'MEET',
  'SCOPE',
  'DECLINE',
  'ASK',
  'ANSWER',
  'ANSWER_HOLD',
  'CONFIRM',
  'CLARIFY',
] as const;
export type OptionKind = (typeof OPTION_KINDS)[number];

/** the brief's option families a–f */
export const FAMILY: Record<OptionKind, 'a' | 'b' | 'c' | 'd' | 'e' | 'f'> = {
  HOLD: 'a',
  TRADE: 'b',
  STEP: 'c',
  MEET: 'c',
  SCOPE: 'd',
  DECLINE: 'e',
  ASK: 'f',
  ANSWER: 'f',
  ANSWER_HOLD: 'f',
  CONFIRM: 'f',
  CLARIFY: 'f',
};

export type Position =
  'none' | 'below_floor' | 'floor_to_target' | 'target_to_price' | 'at_or_above_price';

/** A price an option may put in a draft, with its unit. The floor is never one of these. */
export interface AllowedPrice {
  slot: 'your_price' | 'counter_price' | 'client_price' | 'scope_price' | 'agreed_price';
  rupees: bigint;
  unit: LadderUnit;
}

export interface ScopeFigures {
  /** the reduced effort the user typed, exactly as an engine input */
  effort: string;
  floor: bigint;
  target: bigint;
  opening: bigint;
  price: bigint;
}

export type ScopeState =
  | { status: 'ready'; figures: ScopeFigures }
  | { status: 'needs_effort' }
  | { status: 'invalid'; error: 'not_a_number' | 'not_smaller' | 'engine_rejected' };

export interface PlanOption {
  /** stable id for tests and the review checklist: `${kind}` (one option per kind per plan) */
  id: OptionKind;
  kind: OptionKind;
  family: 'a' | 'b' | 'c' | 'd' | 'e' | 'f';
  rank: number;
  /** the decision-table rule that produced it */
  rule: string;
  /** copy ids (packages/planner/src/copy.ts) */
  reason: string;
  risk: string;
  conditional: boolean;
  /** a price lower than your price, with nothing asked back */
  unconditionalConcession: boolean;
  figures: {
    yourPrice: bigint | null;
    counter: bigint | null;
    /** yourPrice − counter, when both exist */
    stepDown: bigint | null;
    clientPrice: bigint | null;
    agreed: bigint | null;
    /** shown to the user only; never a draft slot */
    floorReminder: bigint;
    scope: ScopeState | null;
  };
  condition: ConditionId | null;
  /** every number this option may put in a client-facing draft */
  allowed: AllowedPrice[];
  /** the template slots its drafts need */
  slots: string[];
}

export type PlanNote =
  | 'low_confidence'
  | 'no_move'
  | 'no_amount'
  | 'unit_assumed'
  | 'unit_mismatch'
  | 'not_inr'
  | 'quote_below_floor'
  | 'no_room'
  | 'accept_with_lower_amount';

export interface Plan {
  /** the reference price the options start from (rule P-1 to P-3) */
  yourPrice: bigint;
  priceSource: 'quote' | 'opening' | 'target';
  position: Position;
  /** the client's amount the plan used (null when unusable) */
  clientPrice: bigint | null;
  row: string;
  options: PlanOption[];
  notes: PlanNote[];
}
