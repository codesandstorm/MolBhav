/**
 * Stratified 60/20/20 split and freeze (docs/product/04_research_integrity.md §2 step 5).
 * Stratified on the blind pass-1 move label (labels v1), seed 42. The test file's sha256 is
 * recorded before any training; packages/gold/test/frozen.test.ts fails if it changes later.
 */
import { createHash } from 'node:crypto';
import { MOVES, type Move } from '@molbhav/analyser';
import { rng, shuffle } from './rng.ts';
import type { LabelRow, MessageRow } from './schema.ts';

export const SPLIT_SEED = 42;
export const SHARES = { train: 60, dev: 20, test: 20 } as const;
export type SplitName = keyof typeof SHARES;

export const sha256 = (text: string) => createHash('sha256').update(text, 'utf8').digest('hex');

/** Rows as written to the split files: the message as written, one JSON object per line. */
export const toJsonl = (rows: readonly MessageRow[]) =>
  rows.map((r) => JSON.stringify(r)).join('\n') + (rows.length ? '\n' : '');

export interface SplitResult {
  train: MessageRow[];
  dev: MessageRow[];
  test: MessageRow[];
  /** per split, per v1 move */
  counts: Record<SplitName, Record<Move, number>>;
}

/**
 * Within each move class: shuffle (seeded), then test = round(20%), dev = round(20%), the
 * rest train. Every message needs exactly one v1 label; rows come out sorted by id.
 */
export const stratifiedSplit = (
  messages: readonly MessageRow[],
  labels: readonly LabelRow[],
  seed = SPLIT_SEED,
): SplitResult => {
  const v1 = new Map<string, Move>();
  for (const l of labels) {
    if (l.version !== 'v1') continue;
    if (v1.has(l.message_id)) throw new Error(`two v1 labels for ${l.message_id}`);
    v1.set(l.message_id, l.move);
  }
  const unlabelled = messages.filter((m) => !v1.has(m.id)).map((m) => m.id);
  if (unlabelled.length)
    throw new Error(`label pass 1 is not finished: no v1 label for ${unlabelled.join(', ')}`);
  const r = rng(seed);
  const out: SplitResult = {
    train: [],
    dev: [],
    test: [],
    counts: {
      train: Object.fromEntries(MOVES.map((m) => [m, 0])) as Record<Move, number>,
      dev: Object.fromEntries(MOVES.map((m) => [m, 0])) as Record<Move, number>,
      test: Object.fromEntries(MOVES.map((m) => [m, 0])) as Record<Move, number>,
    },
  };
  for (const move of MOVES) {
    const group = shuffle(
      [...messages].filter((m) => v1.get(m.id) === move).sort((a, b) => a.id.localeCompare(b.id)),
      r,
    );
    const nTest = Math.round((group.length * SHARES.test) / 100);
    const nDev = Math.round((group.length * SHARES.dev) / 100);
    group.forEach((m, i) => {
      const s: SplitName = i < nTest ? 'test' : i < nTest + nDev ? 'dev' : 'train';
      out[s].push(m);
      out.counts[s][move]++;
    });
  }
  for (const s of ['train', 'dev', 'test'] as const)
    out[s].sort((a, b) => a.id.localeCompare(b.id));
  return out;
};

export interface Frozen {
  test_sha256: string;
  frozen_at: string;
  seed: number;
  guidelines_version: string;
  messages: number;
  counts: SplitResult['counts'];
}

/** The eval-report stub, written at freeze time, before any training. */
export const reportStub = (f: Frozen) => {
  const row = (s: SplitName) =>
    `| ${s} | ${MOVES.map((m) => f.counts[s][m]).join(' | ')} | ${MOVES.reduce((t, m) => t + f.counts[s][m], 0)} |`;
  const few = MOVES.filter((m) => f.counts.test[m] < 10);
  return `# Evaluation report (S4a / S4b)

**Status: test split frozen, no results yet.** Every result in this file will be stated as "on N self-authored test messages, directional", with its 95% bootstrap interval and per-class support [EVIDENCE: docs/product/04_research_integrity.md §2.2].

## Limitations (read first)
- One person wrote, labelled and designed the analyser: circularity is reduced (blind labelling, a frozen hashed test split, a disclosed LLM second annotator), not removed.
- Self-authored messages only. Nothing here measures accuracy on real client messages, other people's writing, or other Hinglish varieties.
- There is no human inter-annotator agreement: there is one human.

## Frozen test split
| Field | Value |
|---|---|
| test.jsonl sha256 | \`${f.test_sha256}\` |
| frozen at | ${f.frozen_at} |
| split seed | ${f.seed} (stratified on the blind pass-1 move, 60/20/20) |
| guidelines | ${f.guidelines_version} |
| messages | ${f.messages} |

The test split is never used for training or for tuning rules or thresholds; packages/gold/test/frozen.test.ts fails if test.jsonl changes.

| split | ${MOVES.join(' | ')} | total |
|---|${MOVES.map(() => '---:').join('|')}|---:|
${row('train')}
${row('dev')}
${row('test')}

${few.length ? `Too few to score on test (< 10): ${few.join(', ')}.` : 'Every learned class has at least 10 test items.'}

## Results
[GAP] Not run. The rule baseline is scored once, on the frozen test split, after any dev-only tuning.
`;
};
