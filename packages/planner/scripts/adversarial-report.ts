/**
 * Prints the A5 adversarial counts: cases per category, how many failed the check (must be all),
 * the reasons the checker gave, and the controls that passed. Run:
 * npm run report:adversarial -w @molbhav/planner
 */
import { checkDraft } from '../src/check.ts';
import { ALLOWED, CASES, CONTROLS, SEED } from '../test/adversarial.ts';

const rows = new Map<string, { n: number; failed: number; reasons: Map<string, number> }>();
for (const c of CASES) {
  const r = checkDraft(c.text, ALLOWED);
  const row = rows.get(c.category) ?? { n: 0, failed: 0, reasons: new Map() };
  row.n++;
  if (!r.ok) row.failed++;
  const first = r.offending[0]?.reason ?? 'PASSED';
  row.reasons.set(first, (row.reasons.get(first) ?? 0) + 1);
  rows.set(c.category, row);
}
const pad = (s: string | number, n: number) => String(s).padEnd(n);
console.log(
  `A5 adversarial set, seed ${SEED}: ${CASES.length} cases (${CASES.filter((c) => c.how === 'seeded').length} seeded, ${CASES.filter((c) => c.how === 'hand').length} hand-written)`,
);
console.log(`${pad('category', 34)}${pad('cases', 7)}${pad('failed', 8)}first reason`);
let passed = 0;
for (const [cat, r] of [...rows].sort()) {
  passed += r.n - r.failed;
  const reasons = [...r.reasons]
    .sort((a, b) => b[1] - a[1])
    .map(([k, v]) => `${k} ${v}`)
    .join(', ');
  console.log(`${pad(cat, 34)}${pad(r.n, 7)}${pad(r.failed, 8)}${reasons}`);
}
const ctrl = CONTROLS.filter((c) => checkDraft(c.text, ALLOWED).ok).length;
console.log(`invented numbers that passed: ${passed}`);
console.log(`controls passed: ${ctrl} of ${CONTROLS.length}`);
process.exitCode = passed === 0 && ctrl === CONTROLS.length ? 0 : 1;
