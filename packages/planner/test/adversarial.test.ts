/**
 * A5: the adversarial set. Required: 0 invented numbers pass. Counts by category are printed by
 * `npm run report:adversarial -w @molbhav/planner` and recorded in 04 §A5.
 */
import { describe, expect, it } from 'vitest';
import { checkDraft } from '../src/check.ts';
import { ALLOWED, buildCases, CASES, CONTROLS } from './adversarial.ts';

describe('A5 adversarial set (seed 42 + hand-written)', () => {
  it('has at least 300 cases, all marked source "fixture", with unique ids', () => {
    expect(CASES.length).toBeGreaterThanOrEqual(300);
    expect(new Set(CASES.map((c) => c.id)).size).toBe(CASES.length);
    for (const c of CASES) expect(c.source).toBe('fixture');
  });

  it('is the same set on every run (seeded)', () => {
    expect(buildCases()).toEqual(CASES);
  });

  it.each(CASES.map((c) => [c.id, c.category, c.text] as const))(
    '%s (%s) fails the check',
    (_, __, text) => {
      const r = checkDraft(text, ALLOWED);
      expect(r.ok).toBe(false);
      expect(r.offending.length).toBeGreaterThan(0);
    },
  );

  it.each(CONTROLS.map((c) => [c.id, c.text] as const))('control %s passes', (_, text) => {
    const r = checkDraft(text, ALLOWED);
    expect(r.offending).toEqual([]);
    expect(r.ok).toBe(true);
  });
});
