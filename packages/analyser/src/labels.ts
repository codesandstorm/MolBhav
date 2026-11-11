/**
 * The label vocabulary shared by the gold-set toolchain, the rules and the app.
 * Source: ml/gold/GUIDELINES.md v0.2 and D11 option S
 * (docs/product/04_research_integrity.md §2.3).
 */

/** The 6 learned move classes (D11 option S). */
export const MOVES = [
  'PRICE_POSITION',
  'PUSHBACK',
  'CONCESSION',
  'INFO_REQUEST',
  'ACCEPT',
  'OTHER',
] as const;
export type Move = (typeof MOVES)[number];

/**
 * The 6 objection types. The first five are from docs/dataset-audit/AUDIT_REPORT.md §1;
 * COMPETITOR is proposed in GUIDELINES.md §3 [HYPOTHESIS: awaiting the owner's approval].
 */
export const OBJECTIONS = [
  'BUDGET',
  'SCOPE',
  'TIMELINE',
  'PAYMENT_TERMS',
  'TRUST',
  'COMPETITOR',
] as const;
export type Objection = (typeof OBJECTIONS)[number];

export const UNITS = ['fixed', 'hour', 'day', 'month', 'unspecified'] as const;
export type Unit = (typeof UNITS)[number];

export const CURRENCIES = ['INR', 'OTHER'] as const;
export type Currency = (typeof CURRENCIES)[number];

export const LANGUAGES = ['en', 'hinglish'] as const;
export type Language = (typeof LANGUAGES)[number];

export const isMove = (x: unknown): x is Move => MOVES.includes(x as Move);
export const isObjection = (x: unknown): x is Objection => OBJECTIONS.includes(x as Objection);
export const isUnit = (x: unknown): x is Unit => UNITS.includes(x as Unit);

/** longest message the analyser reads; same limit as a gold message and the screen's text box */
export const MAX_TEXT = 2000;

/** below this the screen says "Not sure: pick one" [HYPOTHESIS: to be tuned on the dev split only] */
export const LOW_CONFIDENCE = 0.5;
