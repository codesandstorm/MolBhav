/** Test-only worker entry for node:worker_threads; the app's entry is apps/app/src/analyser.worker.ts. */
import { parentPort } from 'node:worker_threads';
import { serve, type PortLike } from '../../src/serve.ts';

serve(parentPort as unknown as PortLike);
