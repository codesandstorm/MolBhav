import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Worker } from 'node:worker_threads';
import { afterEach, describe, expect, it } from 'vitest';
import { createAnalyserClient, type AnalyserClient, type WorkerLike } from '../src/client.ts';
import { handle, MAX_TEXT } from '../src/serve.ts';

/*
 * The worker boundary, tested with node:worker_threads (the same serve() the browser Worker
 * runs). Message texts are made-up fixtures, not gold.
 */
let client: AnalyserClient | null = null;
afterEach(() => {
  client?.dispose();
  client = null;
});

const nodeWorker = (): WorkerLike => {
  const w = new Worker(new URL('./fixtures/node-worker.ts', import.meta.url));
  return {
    postMessage: (m) => w.postMessage(m),
    addEventListener: (_type, listener) => w.on('message', (data: unknown) => listener({ data })),
    terminate: () => void w.terminate(),
  };
};

describe('analyser worker', () => {
  it('answers over the boundary, with bigint rupees intact', async () => {
    client = createAnalyserClient(nodeWorker());
    const a = await client.analyse('Can you do it for ₹28,000?', { quoteSent: true });
    expect(a).toMatchObject({
      move: 'PRICE_POSITION',
      anchorOrCounter: 'COUNTER',
      source: 'rules',
    });
    expect(typeof a.amount.rupees).toBe('bigint');
    expect(a.amount.rupees).toBe(28000n);
  });

  it('the main thread keeps running while the worker reads', async () => {
    client = createAnalyserClient(nodeWorker(), { timeoutMs: 20000 });
    const long = 'Bhai itna zyada? Thoda kam karo, budget 40-45k hai, 2 pages, by 15th Nov. '
      .repeat(26)
      .slice(0, MAX_TEXT);
    let ticks = 0;
    let done = false;
    const tick = () => {
      if (done) return;
      ticks++;
      setImmediate(tick);
    };
    setImmediate(tick);
    const results = await Promise.all(Array.from({ length: 200 }, () => client!.analyse(long)));
    done = true;
    expect(results).toHaveLength(200);
    expect(results.every((r) => r.move === results[0]!.move)).toBe(true);
    // the event loop turned many times while 200 analyses ran elsewhere
    expect(ticks).toBeGreaterThan(20);
  });

  it('rejects bad requests instead of guessing', async () => {
    client = createAnalyserClient(nodeWorker());
    await expect(client.analyse('x'.repeat(MAX_TEXT + 1))).rejects.toThrow(/longer than/);
    expect(handle({ id: 1, text: 42 })).toEqual({
      id: 1,
      ok: false,
      error: 'text must be a string',
    });
    expect(handle({ id: 2, text: 'ok', state: { quoteSent: 'yes' } })).toMatchObject({ ok: false });
    expect(handle({ nope: true })).toBeNull();
  });

  it('times out and closes cleanly', async () => {
    const silent: WorkerLike = { postMessage: () => {}, addEventListener: () => {} };
    const c = createAnalyserClient(silent, { timeoutMs: 20 });
    await expect(c.analyse('ok')).rejects.toThrow(/timed out/);
    const p = c.analyse('ok');
    c.dispose();
    await expect(p).rejects.toThrow(/closed/);
    await expect(c.analyse('ok')).rejects.toThrow(/closed/);
  });

  it('the main-thread client imports only types, so the rules never run on the main thread', () => {
    const src = readFileSync(join(import.meta.dirname, '..', 'src', 'client.ts'), 'utf8');
    const imports = src.split('\n').filter((l) => /^import\s/.test(l));
    expect(imports.length).toBeGreaterThan(0);
    for (const l of imports) expect(l).toMatch(/^import type\s/);
  });
});
