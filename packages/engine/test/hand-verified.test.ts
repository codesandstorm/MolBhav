import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { computeLadder, type LadderInput } from '../src/index.ts';

// Hand-verified examples, written by Sandarbh independently of the engine (spec 13 §8).
// This suite only reads the file; it never edits it or its expected values.
interface Case {
  id: string;
  note?: string;
  input: LadderInput;
  expected: Record<string, unknown>;
}
const cases = JSON.parse(
  readFileSync(join(import.meta.dirname, 'hand_verified.json'), 'utf8'),
) as Case[];

const KNOWN = new Set(['floor', 'target', 'opening', 'error', 'warnings', 'concessionRoomPct']);

describe('hand-verified examples (packages/engine/test/hand_verified.json)', () => {
  it('has at least 10 examples', () => expect(cases.length).toBeGreaterThanOrEqual(10));

  for (const c of cases) {
    it(`${c.id}${c.note ? ` · ${c.note}` : ''}`, () => {
      const unknown = Object.keys(c.expected).filter((k) => !KNOWN.has(k));
      expect(unknown, `unknown expected keys in ${c.id}`).toEqual([]);
      const r = computeLadder(c.input);
      if ('error' in c.expected) {
        expect(r.ok ? 'OK' : r.error).toBe(c.expected.error);
        return;
      }
      if (!r.ok) throw new Error(`${c.id}: engine returned ${r.error}`);
      const big = (v: unknown) => BigInt(v as number);
      expect(r.floor).toBe(big(c.expected.floor));
      expect(r.target).toBe(big(c.expected.target));
      expect(r.opening).toBe(big(c.expected.opening));
      expect(r.warnings).toEqual((c.expected.warnings as string[] | undefined) ?? []);
      if ('concessionRoomPct' in c.expected)
        expect(r.concessionRoomPct).toBe(big(c.expected.concessionRoomPct));
    });
  }
});
