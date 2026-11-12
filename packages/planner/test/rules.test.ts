/**
 * Table-driven tests: one case per row of docs/product/18_planner_rules.md, by id. The example
 * ladder is 13 §3.6 (made up): floor ₹38,000 · target ₹45,600 · opening ₹52,500, step ₹100.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { planReplies, recommendedCondition } from '../src/plan.ts';
import type { OptionKind, Plan } from '../src/types.ts';
import { ladderOf, mk, type Mk } from './support.ts';

const kinds = (p: Plan) => p.options.map((o) => o.kind);
const opt = (p: Plan, k: OptionKind) => p.options.find((o) => o.kind === k)!;

interface Row {
  id: string;
  input: Mk;
  row?: string;
  kinds?: OptionKind[];
  check?: (p: Plan) => void;
}

const HOUR = ladderOf({
  u: 'hour',
  eu: 'hour',
  e: '40',
  K: '120',
  M: '90000',
  C: '0',
  t: '20',
  a: '15',
});
const FLAT = ladderOf({
  u: 'fixed',
  eu: 'day',
  e: '7',
  K: '18',
  M: '90000',
  C: '3000',
  t: '0',
  a: '0',
});

const ROWS: Row[] = [
  // §2 your price
  {
    id: 'P-1',
    input: { quote: 50000n },
    check: (p) => expect([p.yourPrice, p.priceSource]).toEqual([50000n, 'quote']),
  },
  {
    id: 'P-2',
    input: { quote: 30000n },
    check: (p) => {
      expect([p.yourPrice, p.priceSource]).toEqual([45600n, 'target']);
      expect(p.notes).toContain('quote_below_floor');
    },
  },
  {
    id: 'P-3',
    input: {},
    check: (p) => expect([p.yourPrice, p.priceSource]).toEqual([52500n, 'opening']),
  },
  // §3 the client's amount
  {
    id: 'U-0',
    input: { amount: null },
    row: 'M-5',
    check: (p) => expect(p.notes).toContain('no_amount'),
  },
  {
    id: 'C-1',
    input: { amount: 30000n, currency: 'OTHER' },
    row: 'M-5',
    check: (p) => {
      expect(p.notes).toContain('not_inr');
      expect(p.clientPrice).toBeNull();
    },
  },
  {
    id: 'U-1',
    input: { amount: 40000n, unit: 'unspecified' },
    row: 'M-3',
    check: (p) => {
      expect(p.notes).toContain('unit_assumed');
      expect(p.clientPrice).toBe(40000n);
    },
  },
  {
    id: 'U-2',
    input: { amount: 40000n, unit: 'fixed' },
    row: 'M-3',
    check: (p) => expect(p.notes).toEqual([]),
  },
  {
    id: 'U-3',
    input: { amount: 1200n, unit: 'hour' },
    row: 'M-5',
    check: (p) => {
      expect(p.notes).toContain('unit_mismatch');
      expect(p.position).toBe('none');
    },
  },
  // §4 rows
  {
    id: 'L-1',
    input: { amount: 30000n, source: 'analyser', confidence: 0.3 },
    row: 'L-1',
    kinds: ['TRADE', 'HOLD', 'ASK'],
    check: (p) => {
      expect(p.notes).toContain('low_confidence');
      expect(p.clientPrice).toBeNull();
    },
  },
  {
    id: 'L-1 (no move)',
    input: { move: null, source: 'analyser', confidence: 0 },
    row: 'L-1',
    kinds: ['TRADE', 'HOLD', 'ASK'],
    check: (p) => expect(p.notes).toContain('no_move'),
  },
  {
    id: 'M-1',
    input: { amount: 60000n },
    row: 'M-1',
    kinds: ['CONFIRM', 'CLARIFY'],
    check: (p) => expect(opt(p, 'CONFIRM').figures.agreed).toBe(60000n),
  },
  {
    id: 'M-2',
    input: { amount: 48000n },
    row: 'M-2',
    kinds: ['TRADE', 'HOLD', 'STEP'],
    check: (p) => {
      expect(opt(p, 'TRADE').figures.counter).toBe(50800n);
      expect(opt(p, 'STEP').figures.counter).toBe(49100n);
    },
  },
  {
    id: 'M-3',
    input: { amount: 40000n },
    row: 'M-3',
    kinds: ['TRADE', 'HOLD', 'SCOPE', 'STEP'],
  },
  {
    id: 'M-4',
    input: { amount: 30000n },
    row: 'M-4',
    kinds: ['DECLINE', 'SCOPE', 'TRADE'],
    check: (p) => expect(opt(p, 'DECLINE').figures.clientPrice).toBe(30000n),
  },
  { id: 'M-5', input: { amount: null }, row: 'M-5', kinds: ['TRADE', 'HOLD', 'ASK'] },
  { id: 'M-6', input: { move: 'INFO_REQUEST' }, row: 'M-6', kinds: ['ANSWER', 'ANSWER_HOLD'] },
  {
    id: 'M-7',
    input: { move: 'ACCEPT', quote: 50000n },
    row: 'M-7',
    kinds: ['CONFIRM', 'CLARIFY'],
    check: (p) => expect(opt(p, 'CONFIRM').figures.agreed).toBe(50000n),
  },
  {
    id: 'M-7 (lower amount → counter)',
    input: { move: 'ACCEPT', amount: 40000n },
    row: 'M-3',
    check: (p) => expect(p.notes).toContain('accept_with_lower_amount'),
  },
  { id: 'M-8', input: { move: 'OTHER' }, row: 'M-8', kinds: ['CLARIFY', 'HOLD'] },
  // §5 objection modifiers
  {
    id: 'O-1',
    input: { amount: 40000n, objection: 'SCOPE' },
    kinds: ['HOLD', 'TRADE', 'SCOPE', 'STEP'],
  },
  {
    id: 'O-1 (competitor)',
    input: { amount: 48000n, objection: 'COMPETITOR' },
    kinds: ['HOLD', 'TRADE', 'STEP'],
    check: (p) => expect(opt(p, 'HOLD').reason).toBe('reason.HOLD.competitor'),
  },
  {
    id: 'O-2',
    input: { amount: 40000n, objection: 'BUDGET' },
    kinds: ['TRADE', 'SCOPE', 'HOLD', 'STEP'],
  },
  {
    id: 'O-2 (no amount)',
    input: { objection: 'BUDGET' },
    kinds: ['TRADE', 'HOLD', 'ASK', 'SCOPE'],
  },
  {
    id: 'O-3',
    input: { amount: 40000n, objection: 'TRUST' },
    check: (p) => {
      expect(opt(p, 'TRADE').condition).toBe('MILESTONES');
      expect(recommendedCondition('PAYMENT_TERMS')).toBe('MILESTONES');
      expect(recommendedCondition('SCOPE')).toBe('SCOPE_REDUCE');
      expect(recommendedCondition('BUDGET')).toBe('ADVANCE');
      expect(recommendedCondition(null)).toBe('ADVANCE');
    },
  },
  {
    id: 'O-3 (user pick wins)',
    input: { amount: 40000n, objection: 'TRUST', condition: 'PORTFOLIO' },
    check: (p) => expect(opt(p, 'TRADE').condition).toBe('PORTFOLIO'),
  },
  // §6 options and figures
  {
    id: 'A-1',
    input: { amount: 40000n },
    check: (p) => expect(opt(p, 'HOLD').figures.yourPrice).toBe(52500n),
  },
  {
    id: 'S-1',
    input: { amount: 40000n },
    check: (p) => {
      const s = opt(p, 'STEP');
      expect([s.figures.counter, s.figures.stepDown, s.unconditionalConcession]).toEqual([
        49100n,
        3400n,
        true,
      ]);
    },
  },
  {
    id: 'S-2',
    input: { amount: 40000n },
    check: (p) => {
      const t = opt(p, 'TRADE');
      expect([t.figures.counter, t.figures.stepDown, t.conditional]).toEqual([50800n, 1700n, true]);
      expect(t.allowed.map((a) => a.rupees)).toEqual([50800n, 52500n]);
    },
  },
  {
    id: 'S-2 (their number above the trade counter)',
    input: { amount: 51000n },
    check: (p) => expect(opt(p, 'TRADE').figures.counter).toBe(51000n),
  },
  {
    id: 'S-4',
    input: { amount: 50000n },
    kinds: ['TRADE', 'HOLD', 'MEET'],
    check: (p) => expect(opt(p, 'MEET').figures.counter).toBe(50000n),
  },
  {
    id: 'D-1',
    input: { amount: 30000n, reducedEffort: '5' },
    check: (p) => {
      const sc = opt(p, 'SCOPE').figures.scope;
      // 5 days: ₹90,000 × 5 ÷ 18 + ₹3,000 = ₹28,000; target ×1.2 = ₹33,600; opening ×1.15 → ₹38,700
      expect(sc).toEqual({
        status: 'ready',
        figures: { effort: '5', floor: 28000n, target: 33600n, opening: 38700n, price: 33600n },
      });
    },
  },
  {
    id: 'D-1 (their number on the smaller ladder)',
    input: { amount: 35000n, reducedEffort: '5' },
    check: (p) => {
      const sc = opt(p, 'SCOPE').figures.scope;
      expect(sc?.status === 'ready' && sc.figures.price).toBe(35000n);
    },
  },
  {
    id: 'D-1 (needs effort)',
    input: { amount: 30000n },
    check: (p) => {
      expect(opt(p, 'SCOPE').figures.scope).toEqual({ status: 'needs_effort' });
      expect(opt(p, 'SCOPE').allowed).toEqual([]);
    },
  },
  {
    id: 'D-1 (not smaller)',
    input: { amount: 30000n, reducedEffort: '7' },
    check: (p) =>
      expect(opt(p, 'SCOPE').figures.scope).toEqual({ status: 'invalid', error: 'not_smaller' }),
  },
  {
    id: 'D-1 (not a number)',
    input: { amount: 30000n, reducedEffort: 'five' },
    check: (p) =>
      expect(opt(p, 'SCOPE').figures.scope).toEqual({ status: 'invalid', error: 'not_a_number' }),
  },
  {
    id: 'D-1 (per hour: not offered)',
    input: { ladder: HOUR, amount: 100n, unit: 'hour' },
    check: (p) => expect(kinds(p)).not.toContain('SCOPE'),
  },
  {
    id: 'E-1',
    input: { amount: 30000n },
    check: (p) => expect(opt(p, 'DECLINE').allowed.map((a) => a.rupees)).toEqual([30000n]),
  },
  {
    id: 'Q-0',
    input: { move: 'OTHER' },
    check: (p) => expect(opt(p, 'CLARIFY').allowed).toEqual([]),
  },
  {
    id: 'Q-1',
    input: { move: 'INFO_REQUEST' },
    check: (p) => expect(opt(p, 'ANSWER_HOLD').figures.yourPrice).toBe(52500n),
  },
  {
    id: 'Q-2',
    input: { move: 'ACCEPT' },
    check: (p) => expect(opt(p, 'CONFIRM').allowed.map((a) => a.rupees)).toEqual([52500n]),
  },
  // §7 guards
  {
    id: 'F-1',
    input: { amount: 20000n, reducedEffort: '6' },
    check: (p) => {
      for (const o of p.options)
        for (const a of o.allowed) {
          if (o.kind === 'DECLINE') continue; // their own number, quoted back to turn it down
          const sc = o.figures.scope;
          const floor =
            a.slot === 'scope_price' && sc?.status === 'ready' ? sc.figures.floor : 38000n;
          expect(a.rupees).toBeGreaterThanOrEqual(floor);
        }
    },
  },
  {
    id: 'F-2',
    input: { ladder: FLAT, amount: null },
    kinds: ['ASK', 'CLARIFY'],
    check: (p) => {
      expect(FLAT.floor).toBe(FLAT.opening);
      expect(p.options.flatMap((o) => o.allowed)).toEqual([]);
    },
  },
  {
    id: 'F-2 (sent quote at the floor may be restated)',
    input: { quote: 38000n, amount: null },
    check: (p) => expect(opt(p, 'HOLD').figures.yourPrice).toBe(38000n),
  },
  {
    id: 'G-1',
    input: { amount: 50000n },
    check: (p) => expect(p.options[0]!.unconditionalConcession).toBe(false),
  },
  {
    id: 'N-1',
    input: { ladder: FLAT, move: 'OTHER' },
    check: (p) => expect(p.options.length).toBeGreaterThanOrEqual(2),
  },
];

describe('decision table (18_planner_rules.md), one case per rule id', () => {
  for (const r of ROWS)
    it(r.id, () => {
      const p = planReplies(mk(r.input));
      if (r.row) expect(p.row).toBe(r.row);
      if (r.kinds) expect(kinds(p)).toEqual(r.kinds);
      r.check?.(p);
      expect(p.options.length).toBeGreaterThanOrEqual(2);
      expect(p.options.length).toBeLessThanOrEqual(4);
    });

  it('every rule id in the doc has a test, and every tested id is in the doc', () => {
    const doc = readFileSync(
      join(import.meta.dirname, '..', '..', '..', 'docs', 'product', '18_planner_rules.md'),
      'utf8',
    );
    const docIds = new Set([...doc.matchAll(/^\| ([A-Z]-\d) \|/gm)].map((m) => m[1]!));
    const tested = new Set(ROWS.map((r) => r.id.split(' ')[0]!));
    expect([...docIds].filter((id) => !tested.has(id) && id !== 'R-1' && id !== 'R-2')).toEqual([]);
    expect([...tested].filter((id) => !docIds.has(id))).toEqual([]);
  });
});
