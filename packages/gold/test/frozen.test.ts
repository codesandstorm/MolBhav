import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { FROZEN, SPLITS } from '../src/paths.ts';
import { sha256 } from '../src/split.ts';

/**
 * The frozen test split must never change (docs/product/04_research_integrity.md §2 step 5).
 * Before freezing, frozen.json has test_sha256: null and this only checks that no test split
 * exists. After freezing, test.jsonl must hash to the recorded value. If ml/gold/data/ is not
 * committed, CI cannot see test.jsonl: then, and only in CI, the hash check is skipped (and
 * shows as skipped). Locally a missing file fails.
 */
const frozen = JSON.parse(readFileSync(FROZEN, 'utf8')) as { test_sha256: string | null };
const test = join(SPLITS, 'test.jsonl');

describe('frozen test split', () => {
  it.runIf(frozen.test_sha256 === null)('not frozen yet: no test split may exist', () => {
    expect(existsSync(test), 'a test.jsonl exists but no hash was recorded').toBe(false);
  });

  it.runIf(frozen.test_sha256 !== null && (existsSync(test) || !process.env.CI))(
    'test.jsonl still hashes to the recorded sha256',
    () => {
      expect(existsSync(test), `${test} is missing`).toBe(true);
      expect(sha256(readFileSync(test, 'utf8'))).toBe(frozen.test_sha256);
    },
  );
});
