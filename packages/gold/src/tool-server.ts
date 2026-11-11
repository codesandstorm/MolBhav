/**
 * The local writing and blind-labelling tools (docs/product/04_research_integrity.md §2
 * steps 3, 4 and 6). One tiny HTTP server, bound to 127.0.0.1 only, serving two static pages
 * and a JSON API that reads and appends JSONL files under ml/gold/data/.
 *
 * Offline and private by construction:
 * - binds to the loopback address; requests with any other Host header are refused (stops DNS
 *   rebinding), and writes need a same-origin Origin header;
 * - a Content-Security-Policy that allows only this origin, so the pages cannot load or send
 *   anything elsewhere; no external fonts, scripts or analytics;
 * - nothing is cached by the browser (no-store).
 * Writing: one card at a time, resume, edit (until labelled), skip, progress, writing time.
 * Labelling: shuffled, blind: the message text and one neutral context line from the card's
 * quote ("Freelancer's quote so far: ₹X" or "No quote sent yet", GUIDELINES §0), and nothing
 * else (no card, no intended move, no objection, no language, no amount format); class,
 * objection, amount fields, labelling time. The context shown is stored with each label. Pass v2 (test-retest) only offers messages
 * whose v1 label is at least 14 days old, and never shows the v1 label.
 */
import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http';
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { contextLine, describeCard, labelContext, type Card } from './cards.ts';
import { rng, shuffle } from './rng.ts';
import {
  parseJsonl,
  SOURCE,
  validateLabel,
  validateMessage,
  type LabelRow,
  type MessageRow,
} from './schema.ts';

export const TOOL_VERSION = 'gold-tools 0.2';
export const RETEST_DAYS = 14;
export const LABEL_SEED = 42;

export interface ToolOptions {
  mode: 'write' | 'label';
  pass?: 'v1' | 'v2';
  dataDir: string;
  cards: readonly Card[];
  staticDir: string;
  tokensCss?: string;
  now?: () => Date;
}

const STATIC: Record<string, [string, string]> = {
  '/tool.css': ['tool.css', 'text/css; charset=utf-8'],
  '/write.js': ['write.js', 'text/javascript; charset=utf-8'],
  '/label.js': ['label.js', 'text/javascript; charset=utf-8'],
};

const HEADERS = {
  'Content-Security-Policy':
    "default-src 'none'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
  'Cache-Control': 'no-store',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
  'Cross-Origin-Resource-Policy': 'same-origin',
};

const readRows = <T>(p: string): T[] =>
  existsSync(p) ? parseJsonl<T>(readFileSync(p, 'utf8')) : [];
const writeRows = (p: string, rows: readonly unknown[]) => {
  const tmp = `${p}.tmp`;
  writeFileSync(tmp, rows.map((r) => JSON.stringify(r)).join('\n') + (rows.length ? '\n' : ''));
  renameSync(tmp, p);
};

export const createToolServer = (o: ToolOptions): Server => {
  mkdirSync(o.dataDir, { recursive: true });
  const now = o.now ?? (() => new Date());
  const pass = o.pass ?? 'v1';
  const messagesPath = join(o.dataDir, 'messages.jsonl');
  const skippedPath = join(o.dataDir, 'skipped.json');
  const labelsPath = (v: 'v1' | 'v2') => join(o.dataDir, `labels_${v}.jsonl`);
  const cardIds = new Set(o.cards.map((c) => c.card_id));
  const cardById = new Map(o.cards.map((c) => [c.card_id, c]));

  const skipped = (): string[] =>
    existsSync(skippedPath) ? (JSON.parse(readFileSync(skippedPath, 'utf8')) as string[]) : [];
  const nextId = (rows: MessageRow[]) => {
    const max = rows.reduce((m, r) => Math.max(m, Number(r.id.slice(1))), 0);
    return `m${String(max + 1).padStart(4, '0')}`;
  };

  const writeState = () => {
    const messages = readRows<MessageRow>(messagesPath);
    const labelled = new Set(readRows<LabelRow>(labelsPath('v1')).map((l) => l.message_id));
    const secs = messages.map((m) => m.meta?.writing_seconds ?? 0).sort((a, b) => a - b);
    return {
      mode: 'write',
      cards: o.cards.map((c) => ({
        card_id: c.card_id,
        lines: describeCard(c),
        context: contextLine(labelContext(c)),
        language: c.language,
      })),
      messages: messages.map((m) => ({
        id: m.id,
        card_id: m.card_id,
        text: m.text,
        language: m.language,
        writing_seconds: m.meta?.writing_seconds ?? null,
        labelled: labelled.has(m.id),
      })),
      skipped: skipped(),
      median_seconds: secs.length ? secs[Math.floor((secs.length - 1) / 2)] : null,
    };
  };

  /** Blind queue: id, text and the one context line only, shuffled with a fixed seed per pass. */
  const labelState = () => {
    const messages = readRows<MessageRow>(messagesPath);
    const done = new Set(readRows<LabelRow>(labelsPath(pass)).map((l) => l.message_id));
    let eligible = messages;
    let waiting = 0;
    if (pass === 'v2') {
      const v1 = new Map(
        readRows<LabelRow>(labelsPath('v1')).map((l) => [l.message_id, l.labelled_at]),
      );
      const cutoff = now().getTime() - RETEST_DAYS * 86_400_000;
      eligible = messages.filter((m) => {
        const at = v1.get(m.id);
        const ok = at !== undefined && Date.parse(at) <= cutoff;
        if (!ok && at !== undefined) waiting++;
        return ok;
      });
    }
    const order = shuffle(
      eligible.map((m) => m.id),
      rng(LABEL_SEED + (pass === 'v2' ? 1 : 0)),
    );
    const byId = new Map(eligible.map((m) => [m.id, m]));
    const contextOf = (id: string) => {
      const card = cardById.get(byId.get(id)!.card_id);
      return card ? labelContext(card) : null;
    };
    return {
      mode: 'label',
      pass,
      queue: order
        .filter((id) => !done.has(id) && contextOf(id) !== null)
        .map((id) => ({ id, text: byId.get(id)!.text, context: contextLine(contextOf(id)!) })),
      done: done.size,
      total: eligible.length,
      waiting_for_retest_gap: waiting,
      retest_days: RETEST_DAYS,
    };
  };

  const saveMessage = (b: Record<string, unknown>) => {
    const rows = readRows<MessageRow>(messagesPath);
    const card = String(b.card_id ?? '');
    if (!cardIds.has(card)) return [400, { error: 'unknown card' }] as const;
    const seconds =
      typeof b.seconds === 'number' && b.seconds >= 0 ? Math.round(b.seconds * 10) / 10 : 0;
    const t = now().toISOString();
    if (typeof b.id === 'string' && b.id) {
      const i = rows.findIndex((r) => r.id === b.id);
      if (i < 0) return [404, { error: 'no such message' }] as const;
      const labelled = readRows<LabelRow>(labelsPath('v1')).some((l) => l.message_id === b.id);
      if (labelled)
        return [
          409,
          { error: 'Already labelled: write a new message instead (GUIDELINES §7).' },
        ] as const;
      const old = rows[i]!;
      const row: MessageRow = {
        ...old,
        text: String(b.text ?? ''),
        language: b.language === 'en' ? 'en' : 'hinglish',
        meta: {
          written_at: old.meta?.written_at ?? t,
          writing_seconds: (old.meta?.writing_seconds ?? 0) + seconds,
          tool: TOOL_VERSION,
          edited_at: t,
        },
      };
      const errors = validateMessage(row);
      if (errors.length) return [400, { error: errors.join('; ') }] as const;
      rows[i] = row;
      writeRows(messagesPath, rows);
      return [200, { id: row.id }] as const;
    }
    if (rows.some((r) => r.card_id === card))
      return [409, { error: 'This card already has a message; edit it instead.' }] as const;
    const row: MessageRow = {
      id: nextId(rows),
      text: String(b.text ?? ''),
      source: SOURCE,
      card_id: card,
      language: b.language === 'en' ? 'en' : 'hinglish',
      labels: null,
      meta: { written_at: t, writing_seconds: seconds, tool: TOOL_VERSION },
    };
    const errors = validateMessage(row);
    if (errors.length) return [400, { error: errors.join('; ') }] as const;
    writeRows(messagesPath, [...rows, row]);
    writeFileSync(skippedPath, JSON.stringify(skipped().filter((c) => c !== card)));
    return [200, { id: row.id }] as const;
  };

  const skipCard = (b: Record<string, unknown>) => {
    const card = String(b.card_id ?? '');
    if (!cardIds.has(card)) return [400, { error: 'unknown card' }] as const;
    const s = skipped();
    if (!s.includes(card)) s.push(card);
    writeFileSync(skippedPath, JSON.stringify(s));
    return [200, { skipped: s.length }] as const;
  };

  const saveLabel = (b: Record<string, unknown>) => {
    const ids = new Set(labelState().queue.map((q) => q.id));
    const already = readRows<LabelRow>(labelsPath(pass));
    const id = String(b.message_id ?? '');
    if (!ids.has(id) && !already.some((l) => l.message_id === id))
      return [400, { error: 'not in this pass' }] as const;
    const message = readRows<MessageRow>(messagesPath).find((m) => m.id === id);
    const card = message ? cardById.get(message.card_id) : undefined;
    if (!card) return [400, { error: 'message has no known card' }] as const;
    const row: LabelRow = {
      message_id: id,
      version: pass,
      // what the labeller was shown, taken from the card here, never from the request
      context: labelContext(card),
      move: b.move as LabelRow['move'],
      objection: b.objection as LabelRow['objection'],
      conditional: (b.conditional ?? null) as boolean | null,
      amount: b.amount as LabelRow['amount'],
      unsure: b.unsure === true,
      labelled_at: now().toISOString(),
      labelling_seconds:
        typeof b.seconds === 'number' && b.seconds >= 0 ? Math.round(b.seconds * 10) / 10 : 0,
    };
    const errors = validateLabel(row);
    if (errors.length) return [400, { error: errors.join('; ') }] as const;
    writeRows(labelsPath(pass), [...already.filter((l) => l.message_id !== id), row]);
    return [200, { ok: true }] as const;
  };

  const send = (res: ServerResponse, status: number, body: string, type: string) => {
    res.writeHead(status, { ...HEADERS, 'Content-Type': type });
    res.end(body);
  };
  const json = (res: ServerResponse, status: number, body: unknown) =>
    send(res, status, JSON.stringify(body), 'application/json; charset=utf-8');

  const readBody = (req: IncomingMessage) =>
    new Promise<Record<string, unknown>>((resolve, reject) => {
      let s = '';
      req.on('data', (c: Buffer) => {
        s += c.toString('utf8');
        if (s.length > 64_000) reject(new Error('too large'));
      });
      req.on('end', () => {
        try {
          resolve(JSON.parse(s || '{}') as Record<string, unknown>);
        } catch (e) {
          reject(e as Error);
        }
      });
    });

  const server = createServer((req, res) => {
    void (async () => {
      const addr = server.address();
      const port = typeof addr === 'object' && addr ? addr.port : 0;
      const allowed = [`127.0.0.1:${port}`, `localhost:${port}`];
      if (!allowed.includes(req.headers.host ?? '')) return json(res, 421, { error: 'wrong host' });
      const url = new URL(req.url ?? '/', `http://127.0.0.1:${port}`);
      if (req.method === 'GET') {
        if (url.pathname === '/')
          return send(
            res,
            200,
            readFileSync(join(o.staticDir, `${o.mode}.html`), 'utf8'),
            'text/html; charset=utf-8',
          );
        if (url.pathname === '/tokens.css' && o.tokensCss)
          return send(res, 200, readFileSync(o.tokensCss, 'utf8'), 'text/css; charset=utf-8');
        const s = STATIC[url.pathname];
        if (s) return send(res, 200, readFileSync(join(o.staticDir, s[0]), 'utf8'), s[1]);
        if (url.pathname === '/api/state')
          return json(res, 200, o.mode === 'write' ? writeState() : labelState());
        return json(res, 404, { error: 'not found' });
      }
      if (req.method === 'POST') {
        const origin = req.headers.origin ?? '';
        if (!allowed.map((h) => `http://${h}`).includes(origin))
          return json(res, 403, { error: 'cross-origin write refused' });
        const body = await readBody(req);
        const route = `${o.mode} ${url.pathname}`;
        const [status, out] =
          route === 'write /api/save'
            ? saveMessage(body)
            : route === 'write /api/skip'
              ? skipCard(body)
              : route === 'label /api/save'
                ? saveLabel(body)
                : ([404, { error: 'not found' }] as const);
        return json(res, status, out);
      }
      return json(res, 405, { error: 'method not allowed' });
    })().catch(() => json(res, 400, { error: 'bad request' }));
  });
  return server;
};
