/**
 * Validate the gold-set files that exist under ml/gold/data/:
 *   messages.jsonl, labels_v1.jsonl, labels_v2.jsonl, labels_llm.jsonl, adjudication.jsonl
 * Fails on any source other than "self_authored", duplicate ids, missing or unknown fields,
 * floats or words in money fields, labels that point at unknown messages, and labels whose
 * stored quote context differs from what the message's card says the labeller saw.
 * Usage: npm run gold:validate
 */
import { existsSync, readFileSync } from 'node:fs';
import { labelContext, type Card } from '../src/cards.ts';
import { ADJUDICATION, CARDS_FILE, labelsFile, MESSAGES } from '../src/paths.ts';
import { parseJsonl, validateJsonl, type MessageRow } from '../src/schema.ts';

const errors: string[] = [];
let checked = 0;
let ids = new Set<string>();
const cardOf = new Map<string, Card>();
const cards = new Map(
  parseJsonl<Card>(readFileSync(CARDS_FILE, 'utf8')).map((c) => [c.card_id, c]),
);
if (existsSync(MESSAGES)) {
  const t = readFileSync(MESSAGES, 'utf8');
  errors.push(...validateJsonl('messages', t, 'messages.jsonl'));
  try {
    const rows = parseJsonl<MessageRow>(t);
    ids = new Set(rows.map((m) => m.id));
    for (const m of rows) {
      const c = cards.get(m.card_id);
      if (c) cardOf.set(m.id, c);
      else errors.push(`messages.jsonl: ${m.id} points at unknown card ${m.card_id}`);
    }
  } catch {
    /* reported above */
  }
  checked++;
}
for (const v of ['v1', 'v2', 'llm'] as const) {
  const p = labelsFile(v);
  if (!existsSync(p)) continue;
  const t = readFileSync(p, 'utf8');
  errors.push(...validateJsonl('labels', t, `labels_${v}.jsonl`));
  try {
    for (const row of parseJsonl<{ message_id: string; version: string; context: unknown }>(t)) {
      if (row.version !== v)
        errors.push(`labels_${v}.jsonl: ${row.message_id} has version ${row.version}`);
      if (!ids.has(row.message_id))
        errors.push(`labels_${v}.jsonl: unknown message ${row.message_id}`);
      const card = cardOf.get(row.message_id);
      if (card && JSON.stringify(row.context) !== JSON.stringify(labelContext(card)))
        errors.push(`labels_${v}.jsonl: ${row.message_id} context differs from its card`);
    }
  } catch {
    /* reported above */
  }
  checked++;
}
if (existsSync(ADJUDICATION)) {
  errors.push(
    ...validateJsonl('adjudication', readFileSync(ADJUDICATION, 'utf8'), 'adjudication.jsonl'),
  );
  checked++;
}
if (errors.length) {
  console.error(errors.join('\n'));
  console.error(`\n${errors.length} problem(s).`);
  process.exit(1);
}
console.log(checked ? `${checked} file(s) valid.` : 'No gold files yet (ml/gold/data/ is empty).');
