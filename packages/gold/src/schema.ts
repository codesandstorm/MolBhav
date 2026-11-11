/**
 * Gold-set row schemas (S4a). Hand-written validators that mirror the JSON Schema files in
 * ml/gold/schema/ (a test keeps the enums and required lists in step).
 *
 * Research-integrity rules enforced here [EVIDENCE: docs/product/04_research_integrity.md §2]:
 * - a gold message's `source` is always "self_authored"; anything else (including the test
 *   fixtures' "fixture") is rejected;
 * - money is whole rupees as a digit string (no floats anywhere);
 * - ids are unique per file.
 */
import { CURRENCIES, LANGUAGES, MOVES, OBJECTIONS, UNITS } from '@molbhav/analyser';

export const SOURCE = 'self_authored' as const;
export const OBJECTION_VALUES = [...OBJECTIONS, 'NONE'] as const;
export const LABEL_VERSIONS = ['v1', 'v2', 'llm'] as const;
export const ADJUDICATION_FIELDS = ['move', 'objection', 'conditional', 'amount'] as const;

export type LabelVersion = (typeof LABEL_VERSIONS)[number];

export interface AmountLabel {
  rupees: string | null;
  rupees_high: string | null;
  unit: (typeof UNITS)[number] | null;
  currency: (typeof CURRENCIES)[number] | null;
  ambiguous: boolean;
}

export interface LabelCore {
  move: (typeof MOVES)[number];
  objection: (typeof OBJECTION_VALUES)[number];
  /** CONCESSION only; null for every other move */
  conditional: boolean | null;
  amount: AmountLabel;
  unsure: boolean;
}

export interface LabelRow extends LabelCore {
  message_id: string;
  version: LabelVersion;
  labelled_at: string;
  /** measured by the labelling tool; null for the LLM annotator */
  labelling_seconds: number | null;
}

export interface FinalLabels extends LabelCore {
  adjudicated: boolean;
}

export interface MessageRow {
  id: string;
  text: string;
  source: typeof SOURCE;
  card_id: string;
  language: (typeof LANGUAGES)[number];
  /** null until adjudication writes the final label */
  labels: FinalLabels | null;
  meta?: { written_at: string; writing_seconds: number; tool: string; edited_at?: string };
}

export interface AdjudicationRow {
  message_id: string;
  field: (typeof ADJUDICATION_FIELDS)[number];
  author: unknown;
  llm: unknown;
  final: unknown;
  reason: string;
  decided_at: string;
}

export const ID = /^m[0-9]{4}$/;
export const CARD_ID = /^c[0-9]{3}$/;
const DIGITS = /^[1-9][0-9]{0,11}$/;
const ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/;
export const MAX_TEXT = 2000;

const obj = (x: unknown): x is Record<string, unknown> =>
  typeof x === 'object' && x !== null && !Array.isArray(x);
const oneOf = (v: unknown, xs: readonly unknown[]) => xs.includes(v);
const extra = (o: Record<string, unknown>, allowed: string[], at: string) =>
  Object.keys(o)
    .filter((k) => !allowed.includes(k))
    .map((k) => `${at}: unknown field "${k}"`);
const missing = (o: Record<string, unknown>, req: string[], at: string) =>
  req.filter((k) => !(k in o)).map((k) => `${at}: missing field "${k}"`);

export const validateAmount = (a: unknown, at: string): string[] => {
  if (!obj(a)) return [`${at}: amount must be an object`];
  const req = ['rupees', 'rupees_high', 'unit', 'currency', 'ambiguous'];
  const e = [...missing(a, req, at), ...extra(a, req, at)];
  if (e.length) return e;
  if (a.rupees !== null && (typeof a.rupees !== 'string' || !DIGITS.test(a.rupees)))
    e.push(`${at}: rupees must be whole rupees as digits, or null`);
  if (a.rupees_high !== null && (typeof a.rupees_high !== 'string' || !DIGITS.test(a.rupees_high)))
    e.push(`${at}: rupees_high must be digits or null`);
  if (typeof a.ambiguous !== 'boolean') e.push(`${at}: ambiguous must be true or false`);
  if (a.rupees === null) {
    if (a.rupees_high !== null || a.unit !== null || a.currency !== null)
      e.push(`${at}: with no rupees, rupees_high, unit and currency must be null`);
  } else {
    if (!oneOf(a.unit, UNITS)) e.push(`${at}: unit must be one of ${UNITS.join(', ')}`);
    if (!oneOf(a.currency, CURRENCIES)) e.push(`${at}: currency must be INR or OTHER`);
    if (
      typeof a.rupees === 'string' &&
      typeof a.rupees_high === 'string' &&
      DIGITS.test(a.rupees) &&
      DIGITS.test(a.rupees_high) &&
      BigInt(a.rupees_high) <= BigInt(a.rupees)
    )
      e.push(`${at}: rupees_high must be above rupees`);
  }
  return e;
};

const validateCore = (r: Record<string, unknown>, at: string): string[] => {
  const e: string[] = [];
  if (!oneOf(r.move, MOVES)) e.push(`${at}: move must be one of ${MOVES.join(', ')}`);
  if (!oneOf(r.objection, OBJECTION_VALUES))
    e.push(`${at}: objection must be one of ${OBJECTION_VALUES.join(', ')}`);
  if (r.move === 'CONCESSION') {
    if (typeof r.conditional !== 'boolean')
      e.push(`${at}: conditional must be true or false for a CONCESSION`);
  } else if (r.conditional !== null) e.push(`${at}: conditional must be null unless CONCESSION`);
  if (typeof r.unsure !== 'boolean') e.push(`${at}: unsure must be true or false`);
  e.push(...validateAmount(r.amount, `${at} amount`));
  return e;
};

const CORE = ['move', 'objection', 'conditional', 'amount', 'unsure'];

export const validateMessage = (r: unknown, at = 'message'): string[] => {
  if (!obj(r)) return [`${at}: not an object`];
  const req = ['id', 'text', 'source', 'card_id', 'language', 'labels'];
  const e = [...missing(r, req, at), ...extra(r, [...req, 'meta'], at)];
  if (r.source !== SOURCE)
    e.push(`${at}: source must be "${SOURCE}" (got ${JSON.stringify(r.source)})`);
  if (typeof r.id !== 'string' || !ID.test(r.id)) e.push(`${at}: id must look like m0001`);
  if (typeof r.card_id !== 'string' || !CARD_ID.test(r.card_id))
    e.push(`${at}: card_id must look like c001`);
  if (typeof r.text !== 'string' || r.text.trim() === '') e.push(`${at}: text must not be empty`);
  else if (r.text.length > MAX_TEXT) e.push(`${at}: text is longer than ${MAX_TEXT} characters`);
  if (!oneOf(r.language, LANGUAGES)) e.push(`${at}: language must be en or hinglish`);
  if (r.labels !== null && r.labels !== undefined) {
    if (!obj(r.labels)) e.push(`${at}: labels must be an object or null`);
    else {
      const l = r.labels;
      e.push(...missing(l, [...CORE, 'adjudicated'], `${at} labels`));
      e.push(...extra(l, [...CORE, 'adjudicated'], `${at} labels`));
      e.push(...validateCore(l, `${at} labels`));
      if (typeof l.adjudicated !== 'boolean') e.push(`${at} labels: adjudicated must be boolean`);
    }
  }
  if (r.meta !== undefined) {
    if (!obj(r.meta)) e.push(`${at}: meta must be an object`);
    else {
      const m = r.meta;
      e.push(...missing(m, ['written_at', 'writing_seconds', 'tool'], `${at} meta`));
      e.push(...extra(m, ['written_at', 'writing_seconds', 'tool', 'edited_at'], `${at} meta`));
      if (typeof m.written_at !== 'string' || !ISO.test(m.written_at))
        e.push(`${at} meta: written_at must be an ISO time`);
      if (typeof m.writing_seconds !== 'number' || !(m.writing_seconds >= 0))
        e.push(`${at} meta: writing_seconds must be a number ≥ 0`);
    }
  }
  return e;
};

export const validateLabel = (r: unknown, at = 'label'): string[] => {
  if (!obj(r)) return [`${at}: not an object`];
  const req = ['message_id', 'version', ...CORE, 'labelled_at', 'labelling_seconds'];
  const e = [...missing(r, req, at), ...extra(r, req, at)];
  if (e.length) return e;
  if (typeof r.message_id !== 'string' || !ID.test(r.message_id))
    e.push(`${at}: message_id must look like m0001`);
  if (!oneOf(r.version, LABEL_VERSIONS)) e.push(`${at}: version must be v1, v2 or llm`);
  if (typeof r.labelled_at !== 'string' || !ISO.test(r.labelled_at))
    e.push(`${at}: labelled_at must be an ISO time`);
  if (r.version === 'llm') {
    if (r.labelling_seconds !== null) e.push(`${at}: labelling_seconds must be null for llm`);
  } else if (typeof r.labelling_seconds !== 'number' || !(r.labelling_seconds >= 0))
    e.push(`${at}: labelling_seconds must be a number ≥ 0`);
  e.push(...validateCore(r, at));
  return e;
};

export const validateAdjudication = (r: unknown, at = 'adjudication'): string[] => {
  if (!obj(r)) return [`${at}: not an object`];
  const req = ['message_id', 'field', 'author', 'llm', 'final', 'reason', 'decided_at'];
  const e = [...missing(r, req, at), ...extra(r, req, at)];
  if (e.length) return e;
  if (typeof r.message_id !== 'string' || !ID.test(r.message_id))
    e.push(`${at}: message_id must look like m0001`);
  if (!oneOf(r.field, ADJUDICATION_FIELDS))
    e.push(`${at}: field must be one of ${ADJUDICATION_FIELDS.join(', ')}`);
  if (typeof r.reason !== 'string' || r.reason.trim().length < 3)
    e.push(`${at}: every change needs a reason`);
  if (typeof r.decided_at !== 'string' || !ISO.test(r.decided_at))
    e.push(`${at}: decided_at must be an ISO time`);
  return e;
};

export type Kind = 'messages' | 'labels' | 'adjudication';
const VALIDATORS: Record<Kind, (r: unknown, at: string) => string[]> = {
  messages: validateMessage,
  labels: validateLabel,
  adjudication: validateAdjudication,
};

/** Validate a whole JSONL file's text: every row, plus unique ids (messages) or keys (labels). */
export const validateJsonl = (kind: Kind, text: string, file: string = kind): string[] => {
  const errors: string[] = [];
  const seen = new Map<string, number>();
  const lines = text.split(/\r?\n/);
  lines.forEach((line, i) => {
    if (line.trim() === '') return;
    const at = `${file}:${i + 1}`;
    let row: unknown;
    try {
      row = JSON.parse(line);
    } catch {
      errors.push(`${at}: not valid JSON`);
      return;
    }
    errors.push(...VALIDATORS[kind](row, at));
    if (!obj(row)) return;
    const key =
      kind === 'messages'
        ? String(row.id)
        : kind === 'labels'
          ? `${String(row.message_id)}/${String(row.version)}`
          : `${String(row.message_id)}/${String(row.field)}`;
    const first = seen.get(key);
    if (first !== undefined) errors.push(`${at}: duplicate ${key} (first on line ${first})`);
    else seen.set(key, i + 1);
  });
  return errors;
};

export const parseJsonl = <T>(text: string): T[] =>
  text
    .split(/\r?\n/)
    .filter((l) => l.trim() !== '')
    .map((l) => JSON.parse(l) as T);
