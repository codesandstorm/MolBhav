/**
 * S6 draft wording, template path (the LLM path is Phase C2). The input is a DraftRequest:
 * enumerated fields and engine numbers only. It has no free-text field, so the client's message
 * can never reach S6 (D3) — asserted by a type (NoFreeText) and a runtime validator, and tested
 * in draft.test.ts. The same request is the planned body of POST /v1/draft (09 §4).
 */
import { formatINR } from '@molbhav/engine';
import { MOVES, OBJECTIONS, type Move, type Objection } from '@molbhav/analyser/labels';
import { checkDraft, type AllowedNumbers, type CheckResult } from './check.ts';
import {
  ADVANCE_PCTS,
  CONDITIONS,
  OPTION_KINDS,
  type ConditionId,
  type LadderUnit,
  type OptionKind,
  type PlanOption,
} from './types.ts';
import { CONDITION_TEXT, LANGS, TONES, templateFor, type Lang, type Tone } from './templates.ts';

export const NUMBER_SLOTS = [
  'your_price',
  'counter_price',
  'client_price',
  'scope_price',
  'agreed_price',
  'advance_pct',
] as const;
export type NumberSlot = (typeof NUMBER_SLOTS)[number];

export interface DraftRequest {
  kind: OptionKind;
  move: Move | null;
  objection: Objection | null;
  lang: Lang;
  tone: Tone;
  condition: ConditionId | null;
  unit: LadderUnit;
  numbers: Partial<Record<NumberSlot, bigint>>;
}

/** Keys of T whose type admits an arbitrary string (recursively). `never` = no free text. */
export type FreeTextKeys<T> = {
  [K in keyof T]-?: string extends T[K]
    ? K
    : T[K] extends object
      ? [FreeTextKeys<T[K]>] extends [never]
        ? never
        : K
      : never;
}[keyof T];

const KEYS = ['kind', 'move', 'objection', 'lang', 'tone', 'condition', 'unit', 'numbers'];
const UNITS = ['fixed', 'hour', 'month'];
const inList = (v: unknown, xs: readonly unknown[], nullable = false) =>
  (nullable && v === null) || xs.includes(v);

/** Runtime gate for S6 input: exactly the known keys, enum values and bigint numbers. */
export const isDraftRequest = (x: unknown): x is DraftRequest => {
  if (typeof x !== 'object' || x === null || Array.isArray(x)) return false;
  const r = x as Record<string, unknown>;
  const keys = Object.keys(r);
  if (keys.length !== KEYS.length || !keys.every((k) => KEYS.includes(k))) return false;
  if (!inList(r.kind, OPTION_KINDS)) return false;
  if (!inList(r.move, MOVES, true) || !inList(r.objection, OBJECTIONS, true)) return false;
  if (!inList(r.lang, LANGS) || !inList(r.tone, TONES) || !inList(r.unit, UNITS)) return false;
  if (!inList(r.condition, CONDITIONS, true)) return false;
  const n = r.numbers;
  if (typeof n !== 'object' || n === null || Array.isArray(n)) return false;
  return Object.entries(n).every(
    ([k, v]) => (NUMBER_SLOTS as readonly string[]).includes(k) && typeof v === 'bigint' && v > 0n,
  );
};

/**
 * Build the S6 request from a plan option. Only the option's allowed prices, the advance share
 * (when the trade asks for one) and enumerated fields are copied: nothing typed by the client.
 */
export const draftRequest = (
  o: PlanOption,
  ctx: { move: Move | null; objection: Objection | null; lang: Lang; tone: Tone; unit: LadderUnit },
  advancePct: bigint,
): DraftRequest => {
  const numbers: Partial<Record<NumberSlot, bigint>> = {};
  for (const a of o.allowed) numbers[a.slot] = a.rupees;
  if (o.condition === 'ADVANCE' && (ADVANCE_PCTS as readonly bigint[]).includes(advancePct))
    numbers.advance_pct = advancePct;
  return {
    kind: o.kind,
    move: ctx.move,
    objection: ctx.objection,
    lang: ctx.lang,
    tone: ctx.tone,
    condition: o.kind === 'TRADE' ? o.condition : null,
    unit: ctx.unit,
    numbers,
  };
};

/** the numbers a draft for this request may contain */
export const allowedFor = (r: DraftRequest): AllowedNumbers => ({
  prices: (['your_price', 'counter_price', 'client_price', 'scope_price', 'agreed_price'] as const)
    .filter((k) => r.numbers[k] !== undefined)
    .map((k) => ({ rupees: r.numbers[k]!, unit: r.unit })),
  percents: r.numbers.advance_pct === undefined ? [] : [r.numbers.advance_pct],
});

const PER: Record<LadderUnit, string> = { fixed: '', hour: ' per hour', month: ' per month' };

export type Draft =
  | {
      ok: true;
      templateId: string;
      text: string;
      allowed: AllowedNumbers;
      check: CheckResult;
      needsEdit: boolean;
    }
  | {
      ok: false;
      error: 'invalid_request' | 'missing_number' | 'check_failed';
      check?: CheckResult;
    };

/**
 * Fill the template for a request. Fails closed: an invalid request, a slot with no allowed
 * value, or a filled text that does not pass checkDraft gives no draft.
 */
export const fillTemplate = (r: DraftRequest): Draft => {
  if (!isDraftRequest(r)) return { ok: false, error: 'invalid_request' };
  const t = templateFor(r.kind, r.lang, r.tone);
  let text = t.text;
  if (text.includes('{condition}')) {
    if (r.condition === null) return { ok: false, error: 'missing_number' };
    text = text.replace('{condition}', CONDITION_TEXT[r.lang][r.condition]);
  }
  let missing = false;
  text = text.replace(/\{([a-z_]+)\}/g, (_, slot: string) => {
    const v = r.numbers[slot as NumberSlot];
    if (v === undefined) {
      missing = true;
      return '';
    }
    return slot === 'advance_pct' ? v.toString() : formatINR(v) + PER[r.unit];
  });
  if (missing) return { ok: false, error: 'missing_number' };
  const allowed = allowedFor(r);
  const check = checkDraft(text, allowed);
  if (!check.ok) return { ok: false, error: 'check_failed', check };
  return {
    ok: true,
    templateId: t.id,
    text,
    allowed,
    check,
    needsEdit: text.includes('[your edit:'),
  };
};
