import { join } from 'node:path';

/** Where the gold set lives (docs/product/04_research_integrity.md §2). */
export const ROOT = join(import.meta.dirname, '..', '..', '..');
export const GOLD = join(ROOT, 'ml', 'gold');
export const DATA = join(GOLD, 'data');
export const CARDS_FILE = join(GOLD, 'cards', 'cards.jsonl');
export const COVERAGE_FILE = join(GOLD, 'cards', 'COVERAGE.md');
export const MESSAGES = join(DATA, 'messages.jsonl');
export const labelsFile = (v: 'v1' | 'v2' | 'llm') => join(DATA, `labels_${v}.jsonl`);
export const ADJUDICATION = join(DATA, 'adjudication.jsonl');
export const SPLITS = join(DATA, 'splits');
export const FROZEN = join(GOLD, 'eval', 'frozen.json');
export const EVAL_REPORT = join(GOLD, 'eval', 'EVAL_REPORT.md');
export const GUIDELINES = join(GOLD, 'GUIDELINES.md');
