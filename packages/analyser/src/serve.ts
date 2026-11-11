/**
 * The Web Worker side of the analyser. The app's worker entry calls `serve(self)`; the rules
 * then run off the main thread, on the device. Nothing here makes a network request.
 */
import { MAX_TEXT } from './labels.ts';
import { analyse, type Analysis, type DealState } from './rules.ts';

export { MAX_TEXT };

export interface AnalyseRequest {
  id: number;
  text: string;
  state?: DealState;
}
export type AnalyseResponse =
  { id: number; ok: true; analysis: Analysis } | { id: number; ok: false; error: string };

export interface PortLike {
  postMessage(message: AnalyseResponse): void;
  addEventListener(type: 'message', listener: (event: { data: unknown }) => void): void;
}

const isState = (s: unknown): s is DealState =>
  typeof s === 'object' &&
  s !== null &&
  'quoteSent' in s &&
  (s.quoteSent === null || typeof s.quoteSent === 'boolean');

/** One request → one response; anything malformed gets an error, never a guess. */
export const handle = (data: unknown): AnalyseResponse | null => {
  if (typeof data !== 'object' || data === null || !('id' in data) || typeof data.id !== 'number')
    return null;
  const id = data.id;
  if (!('text' in data) || typeof data.text !== 'string')
    return { id, ok: false, error: 'text must be a string' };
  if (data.text.length > MAX_TEXT)
    return { id, ok: false, error: `text is longer than ${MAX_TEXT} characters` };
  const state = 'state' in data && data.state !== undefined ? data.state : { quoteSent: null };
  if (!isState(state))
    return { id, ok: false, error: 'state must be { quoteSent: boolean | null }' };
  try {
    return { id, ok: true, analysis: analyse(data.text, state) };
  } catch (e) {
    return { id, ok: false, error: e instanceof Error ? e.message : 'analysis failed' };
  }
};

export const serve = (port: PortLike): void => {
  port.addEventListener('message', (event) => {
    const response = handle(event.data);
    if (response) port.postMessage(response);
  });
};
