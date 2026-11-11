import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { GOLD } from '../src/paths.ts';
import { SOURCE } from '../src/schema.ts';

/**
 * No fixture (or any other non-self-authored) row may ever sit under ml/gold/. This reads only
 * each row's `source` field; it never looks at message text or labels.
 */
const files = (dir: string): string[] =>
  readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? files(p) : /\.jsonl?$/.test(n) ? [p] : [];
  });

const sourceOf = (line: string): unknown => {
  try {
    const row = JSON.parse(line) as unknown;
    return row && typeof row === 'object' && 'source' in row
      ? (row as { source: unknown }).source
      : undefined;
  } catch {
    return undefined;
  }
};

describe('ml/gold/ holds no fixture rows', () => {
  it('every row that has a source says self_authored', () => {
    const bad: string[] = [];
    for (const f of files(GOLD)) {
      const text = readFileSync(f, 'utf8');
      const rows = f.endsWith('.jsonl') ? text.split(/\r?\n/).filter((l) => l.trim()) : [text];
      rows.forEach((line, i) => {
        const s = sourceOf(line);
        if (s !== undefined && s !== SOURCE) bad.push(`${f}:${i + 1} has source ${String(s)}`);
      });
      if (/"source"\s*:\s*"fixture"/.test(text)) bad.push(`${f}: contains a fixture row`);
    }
    expect(bad).toEqual([]);
  });
});
