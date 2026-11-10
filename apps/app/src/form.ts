import type { ErrorCode, LadderInput } from '@molbhav/engine';
import { errorMessage } from './copy.ts';

/** Raw form state: always strings, exactly what the user typed. */
export interface DealForm {
  name: string;
  u: 'fixed' | 'hour' | 'month';
  eu: 'day' | 'hour';
  e: string;
  K: string;
  M: string;
  C: string;
  b: string;
  t: string;
  a: string;
  Q: string;
  /** true once the user changed t / a (D-L2: RECOMMENDATION until edited, then USER DECISION) */
  tEdited: boolean;
  aEdited: boolean;
}

export const emptyForm: DealForm = {
  name: '',
  u: 'fixed',
  eu: 'day',
  e: '',
  K: '',
  M: '',
  C: '',
  b: '',
  t: '20',
  a: '15',
  Q: '',
  tEdited: false,
  aEdited: false,
};

/** Spec 13 §3.6 illustration, labelled "Example deal (made up)" in the UI. */
export const exampleForm: DealForm = {
  ...emptyForm,
  name: 'Example deal (made up)',
  u: 'fixed',
  eu: 'day',
  e: '7',
  K: '18',
  M: '90,000',
  C: '3,000',
  Q: '45,000',
};

const clean = (s: string): string => s.replace(/[₹\s]/g, '');

export const toLadderInput = (f: DealForm): LadderInput => ({
  u: f.u,
  eu: f.u === 'hour' ? 'hour' : f.eu,
  e: clean(f.e),
  K: clean(f.K),
  M: clean(f.M),
  C: clean(f.C),
  b: clean(f.b),
  t: clean(f.t),
  a: clean(f.a),
  Q: clean(f.Q),
});

const isWholeRupees = (s: string): boolean => /^[\d,]+$/.test(clean(s)) || clean(s) === '';

/** Which field shows an engine error. not_whole_rupees follows the validation order (M before C). */
export const errorField = (code: ErrorCode, f: DealForm): { field: string; text: string } => {
  const m = errorMessage[code];
  if (code === 'not_whole_rupees') return { field: isWholeRupees(f.M) ? 'C' : 'M', text: m.text };
  return m;
};
