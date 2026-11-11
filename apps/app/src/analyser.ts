/**
 * Main-thread access to the analyser Worker. The Worker is created on the first read, and
 * the message only ever goes to it (postMessage), never over the network.
 */
import { createAnalyserClient, type AnalyserClient } from '@molbhav/analyser/client';
import type { Analysis, DealState } from '@molbhav/analyser';

let client: AnalyserClient | null = null;

export const analyseMessage = (text: string, state: DealState): Promise<Analysis> => {
  client ??= createAnalyserClient(
    new Worker(new URL('./analyser.worker.ts', import.meta.url), { type: 'module' }),
  );
  return client.analyse(text, state);
};
