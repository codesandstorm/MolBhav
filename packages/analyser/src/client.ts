/**
 * The main-thread side: sends a message to the analyser Worker and returns a promise.
 * It imports only types, so the rules never load (or run) on the main thread.
 */
import type { Analysis, DealState } from './rules.ts';
import type { AnalyseRequest, AnalyseResponse } from './serve.ts';

export interface WorkerLike {
  postMessage(message: AnalyseRequest): void;
  addEventListener(type: 'message', listener: (event: { data: unknown }) => void): void;
  terminate?(): void;
}

export interface AnalyserClient {
  analyse(text: string, state?: DealState): Promise<Analysis>;
  dispose(): void;
}

export class AnalyserError extends Error {}

export const createAnalyserClient = (
  worker: WorkerLike,
  opts: { timeoutMs?: number } = {},
): AnalyserClient => {
  const timeoutMs = opts.timeoutMs ?? 5000;
  let next = 1;
  let disposed = false;
  const pending = new Map<
    number,
    {
      resolve: (a: Analysis) => void;
      reject: (e: Error) => void;
      timer: ReturnType<typeof setTimeout>;
    }
  >();

  worker.addEventListener('message', (event) => {
    const r = event.data as AnalyseResponse;
    const p = typeof r?.id === 'number' ? pending.get(r.id) : undefined;
    if (!p) return;
    pending.delete(r.id);
    clearTimeout(p.timer);
    if (r.ok) p.resolve(r.analysis);
    else p.reject(new AnalyserError(r.error));
  });

  return {
    analyse(text, state = { quoteSent: null }) {
      if (disposed) return Promise.reject(new AnalyserError('analyser closed'));
      const id = next++;
      return new Promise<Analysis>((resolve, reject) => {
        const timer = setTimeout(() => {
          pending.delete(id);
          reject(new AnalyserError('analyser timed out'));
        }, timeoutMs);
        pending.set(id, { resolve, reject, timer });
        worker.postMessage({ id, text, state });
      });
    },
    dispose() {
      disposed = true;
      for (const [, p] of pending) {
        clearTimeout(p.timer);
        p.reject(new AnalyserError('analyser closed'));
      }
      pending.clear();
      worker.terminate?.();
    },
  };
};
