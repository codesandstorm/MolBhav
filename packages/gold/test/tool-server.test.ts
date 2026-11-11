import { request } from 'node:http';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';
import { afterEach, describe, expect, it } from 'vitest';
import { contextLine, generateCards, labelContext } from '../src/cards.ts';
import { parseJsonl, type LabelRow, type MessageRow } from '../src/schema.ts';
import { createToolServer, type ToolOptions } from '../src/tool-server.ts';

/*
 * The tools are exercised in a temporary folder outside the repository, with text marked
 * "[FIXTURE, not gold]". Nothing here touches ml/gold/.
 */
// three cards: two with a quote sent, one without, so both context lines are exercised
const all = generateCards();
const cards = [...all.filter((c) => c.quote_sent).slice(0, 2), all.find((c) => !c.quote_sent)!];
const staticDir = join(import.meta.dirname, '..', 'tools');
let server: Server | null = null;
let dir = '';

const start = async (o: Partial<ToolOptions>) => {
  dir ||= mkdtempSync(join(tmpdir(), 'gold-tools-'));
  server = createToolServer({ mode: 'write', dataDir: dir, cards, staticDir, ...o });
  await new Promise<void>((r) => server!.listen(0, '127.0.0.1', r));
  return (server.address() as AddressInfo).port;
};
afterEach(async () => {
  await new Promise<void>((r) => (server ? server.close(() => r()) : r()));
  server = null;
});
const cleanup = () => {
  if (dir) rmSync(dir, { recursive: true, force: true });
  dir = '';
};

const call = (
  port: number,
  method: string,
  path: string,
  body?: unknown,
  headers: Record<string, string> = {},
) =>
  new Promise<{
    status: number;
    headers: Record<string, unknown>;
    json: () => unknown;
    text: string;
  }>((resolve, reject) => {
    const data = body === undefined ? undefined : JSON.stringify(body);
    const req = request(
      {
        host: '127.0.0.1',
        port,
        method,
        path,
        headers: {
          Host: `127.0.0.1:${port}`,
          ...(method === 'POST'
            ? { Origin: `http://127.0.0.1:${port}`, 'Content-Type': 'application/json' }
            : {}),
          ...headers,
        },
      },
      (res) => {
        let text = '';
        res.on('data', (c: Buffer) => (text += c.toString('utf8')));
        res.on('end', () =>
          resolve({
            status: res.statusCode ?? 0,
            headers: res.headers,
            text,
            json: () => JSON.parse(text) as unknown,
          }),
        );
      },
    );
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });

describe('writing tool', () => {
  it('serves the page with a same-origin-only CSP and refuses other hosts and origins', async () => {
    const port = await start({});
    const page = await call(port, 'GET', '/');
    expect(page.status).toBe(200);
    expect(page.text).toContain('writing tool');
    expect(String(page.headers['content-security-policy'])).toContain("default-src 'none'");
    expect(String(page.headers['content-security-policy'])).toContain("connect-src 'self'");
    expect((await call(port, 'GET', '/', undefined, { Host: 'evil.example:80' })).status).toBe(421);
    const cross = await call(
      port,
      'POST',
      '/api/save',
      { card_id: cards[0]!.card_id, text: 'x' },
      {
        Origin: 'http://evil.example',
      },
    );
    expect(cross.status).toBe(403);
    cleanup();
  });

  it('saves self-authored rows with writing time, resumes, edits, skips', async () => {
    const port = await start({});
    const [a, b, c] = cards.map((x) => x.card_id);
    const s1 = await call(port, 'POST', '/api/save', {
      card_id: a,
      text: '[FIXTURE, not gold] one',
      language: 'en',
      seconds: 61.24,
    });
    expect(s1.status).toBe(200);
    expect((await call(port, 'POST', '/api/save', { card_id: a, text: 'again' })).status).toBe(409);
    expect((await call(port, 'POST', '/api/skip', { card_id: b })).status).toBe(200);
    const state = (await call(port, 'GET', '/api/state')).json() as {
      messages: { id: string; card_id: string }[];
      cards: { card_id: string; context: string }[];
      skipped: string[];
      median_seconds: number;
    };
    // the writing tool shows the same quote fact the labeller will see
    expect(state.cards.map((c) => c.context)).toEqual(
      cards.map((c) => contextLine(labelContext(c))),
    );
    expect(state.messages.map((m) => m.card_id)).toEqual([a]);
    expect(state.skipped).toEqual([b]);
    expect(state.median_seconds).toBe(61.2);

    const edit = await call(port, 'POST', '/api/save', {
      id: 'm0001',
      card_id: a,
      text: '[FIXTURE, not gold] one, edited',
      language: 'hinglish',
      seconds: 10,
    });
    expect(edit.status).toBe(200);
    await call(port, 'POST', '/api/save', {
      card_id: c,
      text: '[FIXTURE, not gold] two',
      seconds: 5,
    });
    const rows = parseJsonl<MessageRow>(readFileSync(join(dir, 'messages.jsonl'), 'utf8'));
    expect(rows.map((r) => [r.id, r.card_id, r.source, r.language])).toEqual([
      ['m0001', a, 'self_authored', 'hinglish'],
      ['m0002', c, 'self_authored', 'hinglish'],
    ]);
    expect(rows[0]!.meta).toMatchObject({ writing_seconds: 71.2 });
    expect(rows[0]!.meta!.edited_at).toBeTruthy();
    cleanup();
  });

  it('refuses to edit a message that is already labelled', async () => {
    const port = await start({});
    await call(port, 'POST', '/api/save', {
      card_id: cards[0]!.card_id,
      text: '[FIXTURE] x',
      seconds: 1,
    });
    writeFileSync(
      join(dir, 'labels_v1.jsonl'),
      JSON.stringify({ message_id: 'm0001', version: 'v1' }) + '\n',
    );
    const r = await call(port, 'POST', '/api/save', {
      id: 'm0001',
      card_id: cards[0]!.card_id,
      text: '[FIXTURE] y',
    });
    expect(r.status).toBe(409);
    cleanup();
  });
});

describe('blind labelling tool', () => {
  const label = (message_id: string) => ({
    message_id,
    move: 'PUSHBACK',
    objection: 'BUDGET',
    conditional: null,
    amount: { rupees: null, rupees_high: null, unit: null, currency: null, ambiguous: false },
    unsure: false,
    seconds: 12.34,
  });

  const seed = () => {
    dir ||= mkdtempSync(join(tmpdir(), 'gold-tools-'));
    const rows = cards.map((c, i) => ({
      id: `m000${i + 1}`,
      text: `[FIXTURE, not gold] message ${i + 1}`,
      source: 'self_authored',
      card_id: c.card_id,
      language: 'en',
      labels: null,
    }));
    writeFileSync(
      join(dir, 'messages.jsonl'),
      rows.map((r) => JSON.stringify(r)).join('\n') + '\n',
    );
  };

  it('shows the message and one quote context line only (no card, intent or language), shuffled, and saves v1 labels', async () => {
    seed();
    const port = await start({ mode: 'label', pass: 'v1' });
    const state = (await call(port, 'GET', '/api/state')).json() as {
      queue: Record<string, unknown>[];
      total: number;
    };
    expect(state.total).toBe(3);
    const cardOf = (id: unknown) => cards[Number(String(id).slice(1)) - 1]!;
    for (const q of state.queue) {
      expect(Object.keys(q).sort()).toEqual(['context', 'id', 'text']);
      const c = cardOf(q.id);
      expect(q.context).toBe(
        c.quote_sent ? `Freelancer's quote so far: ${c.quote_text}` : 'No quote sent yet',
      );
      // nothing else from the card leaks into the context line
      for (const leak of [c.intended_move, c.objection, c.work, c.amount_format, 'hinglish'])
        expect(String(q.context)).not.toContain(leak);
    }
    const lines = state.queue.map((q) => String(q.context));
    expect(lines.filter((l) => l === 'No quote sent yet')).toHaveLength(1);
    expect(lines.filter((l) => l.startsWith("Freelancer's quote so far: ₹"))).toHaveLength(2);
    const first = state.queue[0]!.id as string;
    expect((await call(port, 'POST', '/api/save', label(first))).status).toBe(200);
    const bad = await call(port, 'POST', '/api/save', { ...label(first), move: 'MAYBE' });
    expect(bad.status).toBe(400);
    const rows = parseJsonl<LabelRow>(readFileSync(join(dir, 'labels_v1.jsonl'), 'utf8'));
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ message_id: first, version: 'v1', labelling_seconds: 12.3 });
    // the stored context comes from the card, not from the request
    expect(rows[0]!.context).toEqual(labelContext(cardOf(first)));
    const forged = await call(port, 'POST', '/api/save', {
      ...label(first),
      context: { quote_rupees: '1', quote_unit: 'fixed' },
    });
    expect(forged.status).toBe(200);
    const again = parseJsonl<LabelRow>(readFileSync(join(dir, 'labels_v1.jsonl'), 'utf8'));
    expect(again[0]!.context).toEqual(labelContext(cardOf(first)));
    const after = (await call(port, 'GET', '/api/state')).json() as {
      queue: unknown[];
      done: number;
    };
    expect(after).toMatchObject({ done: 1 });
    expect(after.queue).toHaveLength(2);
    cleanup();
  });

  it('pass v2 only offers messages labelled at least 14 days earlier', async () => {
    seed();
    const v1 = (id: string, at: string) =>
      JSON.stringify({ ...label(id), version: 'v1', labelled_at: at, labelling_seconds: 1 });
    writeFileSync(
      join(dir, 'labels_v1.jsonl'),
      [v1('m0001', '2026-11-01T00:00:00.000Z'), v1('m0002', '2026-11-10T00:00:00.000Z')].join(
        '\n',
      ) + '\n',
    );
    const port = await start({
      mode: 'label',
      pass: 'v2',
      now: () => new Date('2026-11-16T00:00:00.000Z'),
    });
    const state = (await call(port, 'GET', '/api/state')).json() as {
      queue: { id: string }[];
      waiting_for_retest_gap: number;
    };
    // m0001: 15 days ago → offered; m0002: 6 days ago → waiting; m0003: no v1 label → not offered
    expect(state.queue.map((q) => q.id)).toEqual(['m0001']);
    expect(state.waiting_for_retest_gap).toBe(1);
    expect((await call(port, 'POST', '/api/save', label('m0002'))).status).toBe(400);
    cleanup();
  });
});
