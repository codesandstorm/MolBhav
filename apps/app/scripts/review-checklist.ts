/**
 * Writes docs/product/17_c1_review_checklist.md from test/review-items.ts.
 * Run: node apps/app/scripts/review-checklist.ts   (then prettier formats it in lint-staged/CI)
 */
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { cell, reviewItems } from '../test/review-items.ts';

const out = fileURLToPath(
  new URL('../../../docs/product/17_c1_review_checklist.md', import.meta.url),
);
const items = reviewItems();
const groups = [...new Set(items.map((i) => i.group))];

const lines = [
  '# 17 · C1 review checklist (owner)',
  '',
  'Version 0.1, 2026-11-11 (Phase C1). Every wording below is [HYPOTHESIS]: written by the developer, not tested with users, and waiting for the owner’s review. Generated from the code by `node apps/app/scripts/review-checklist.ts`; `apps/app/test/review-checklist.test.ts` fails if an id or its text is missing or out of date.',
  '',
  '**How to review.** Tick a row when the wording is acceptable. For a change, write the new wording in the Notes column; the developer changes the code and regenerates this file. Check each row against the C1 rules:',
  '- no legal, tax or financial advice; no promise that an option will work; no "win"; no market-rate claim; no claim that trading beats conceding;',
  '- no number in the wording itself: every figure comes from the engine, in a slot such as `{your_price}`;',
  '- Hinglish in Roman script only;',
  '- the floor never appears in client-facing text (templates and trade conditions).',
  '',
  `${items.length} items in ${groups.length} groups. Slots in templates: \`{your_price}\`, \`{counter_price}\`, \`{client_price}\`, \`{scope_price}\`, \`{agreed_price}\`, \`{advance_pct}\`, \`{condition}\`. Parts marked \`[your edit: …]\` are for the user to fill in before sending.`,
  '',
];
for (const g of groups) {
  lines.push(`## ${g}`, '', '| OK | Id | Text | Notes |', '|---|---|---|---|');
  for (const i of items.filter((x) => x.group === g))
    lines.push(`| [ ] | \`${i.id}\` | ${cell(i.text)} | |`);
  lines.push('');
}
writeFileSync(out, lines.join('\n'));
console.log(`wrote ${items.length} items to ${out}`);
