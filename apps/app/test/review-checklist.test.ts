// @vitest-environment node
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { TEMPLATES } from '@molbhav/planner';
import { cell, reviewItems } from './review-items.ts';

const doc = readFileSync(
  fileURLToPath(new URL('../../../docs/product/17_c1_review_checklist.md', import.meta.url)),
  'utf8',
);
/** the doc's rows by id, after prettier has formatted the tables */
const rows = new Map(
  [...doc.matchAll(/^\|\s*\[[ x]\]\s*\|\s*`([^`]+)`\s*\|\s*(.*?)\s*\|[^|\n]*\|\s*$/gm)].map((m) => [
    m[1]!,
    m[2]!,
  ]),
);

describe('17 · C1 review checklist', () => {
  const items = reviewItems();

  it('ids are unique', () => {
    expect(new Set(items.map((i) => i.id)).size).toBe(items.length);
  });

  it('lists every template, option, reason, risk, condition, note and screen copy id', () => {
    expect(TEMPLATES.length).toBe(44);
    const missing = items.filter((i) => !rows.has(i.id)).map((i) => i.id);
    expect(missing).toEqual([]);
  });

  it('shows the current text of each item', () => {
    const stale = items.filter((i) => rows.get(i.id) !== cell(i.text)).map((i) => i.id);
    expect(stale).toEqual([]);
  });

  it('lists nothing that no longer exists', () => {
    const ids = new Set(items.map((i) => i.id));
    expect([...rows.keys()].filter((id) => !ids.has(id))).toEqual([]);
  });
});
