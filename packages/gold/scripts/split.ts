/**
 * Split and freeze the gold set (docs/product/04_research_integrity.md §2 step 5).
 * DO NOT RUN until blind label pass 1 is complete; it refuses to run twice.
 *   npm run gold:split
 * Reads ml/gold/data/messages.jsonl and labels_v1.jsonl; writes ml/gold/data/splits/
 * {train,dev,test}.jsonl, records test.jsonl's sha256 in ml/gold/eval/frozen.json and the
 * eval-report stub ml/gold/eval/EVAL_REPORT.md, before any training.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { EVAL_REPORT, FROZEN, GUIDELINES, labelsFile, MESSAGES, SPLITS } from '../src/paths.ts';
import { parseJsonl, validateJsonl, type LabelRow, type MessageRow } from '../src/schema.ts';
import { reportStub, sha256, SPLIT_SEED, stratifiedSplit, toJsonl } from '../src/split.ts';

const fail = (msg: string): never => {
  console.error(`split: ${msg}`);
  process.exit(1);
};

if (existsSync(FROZEN)) {
  const f = JSON.parse(readFileSync(FROZEN, 'utf8')) as { test_sha256?: string | null };
  if (f.test_sha256) fail(`the test split is already frozen (${FROZEN}). It is never re-split.`);
}
for (const p of [MESSAGES, labelsFile('v1')]) if (!existsSync(p)) fail(`missing ${p}`);
const mText = readFileSync(MESSAGES, 'utf8');
const lText = readFileSync(labelsFile('v1'), 'utf8');
const errors = [
  ...validateJsonl('messages', mText, 'messages.jsonl'),
  ...validateJsonl('labels', lText, 'labels_v1.jsonl'),
];
if (errors.length) fail(`fix these first:\n${errors.join('\n')}`);

const split = stratifiedSplit(parseJsonl<MessageRow>(mText), parseJsonl<LabelRow>(lText));
mkdirSync(SPLITS, { recursive: true });
for (const s of ['train', 'dev', 'test'] as const)
  writeFileSync(join(SPLITS, `${s}.jsonl`), toJsonl(split[s]));
const testText = readFileSync(join(SPLITS, 'test.jsonl'), 'utf8');
const version = /\*\*Version ([0-9.]+)/.exec(readFileSync(GUIDELINES, 'utf8'))?.[1] ?? 'unknown';
const frozen = {
  test_sha256: sha256(testText),
  frozen_at: new Date().toISOString(),
  seed: SPLIT_SEED,
  guidelines_version: `GUIDELINES.md v${version}`,
  messages: split.train.length + split.dev.length + split.test.length,
  counts: split.counts,
};
writeFileSync(FROZEN, JSON.stringify(frozen, null, 2) + '\n');
writeFileSync(EVAL_REPORT, reportStub(frozen));
console.log(`frozen: test.jsonl sha256 ${frozen.test_sha256}`);
console.log(JSON.stringify(split.counts));
