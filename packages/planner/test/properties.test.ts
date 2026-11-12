/**
 * Property tests for the planner (18 §7): never below the floor; every number from the allowed
 * set; same input, same output; never empty; the first option is never a price cut with nothing
 * asked back; low-confidence input gives the safe set and says so. 2,500 runs each.
 */
import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { computeLadder, type LadderOk } from '@molbhav/engine';
import { LOW_CONFIDENCE, MOVES, OBJECTIONS } from '@molbhav/analyser/labels';
import { planReplies } from '../src/plan.ts';
import { stepCounter, tradeCounter } from '../src/steps.ts';
import { ADVANCE_PCTS, CONDITIONS, type PlanInput } from '../src/types.ts';

const RUNS = 2500;

const ladderArb: fc.Arbitrary<LadderOk> = fc
  .record({
    u: fc.constantFrom('fixed', 'month', 'hour'),
    e: fc.integer({ min: 1, max: 400 }),
    K: fc.integer({ min: 1, max: 31 }),
    M: fc.integer({ min: 1000, max: 2_000_000 }),
    C: fc.integer({ min: 0, max: 200_000 }),
    b: fc.integer({ min: 0, max: 50 }),
    t: fc.integer({ min: 0, max: 100 }),
    a: fc.integer({ min: 0, max: 100 }),
  })
  .map(({ u, e, K, M, C, b, t, a }) => {
    const hour = u === 'hour';
    const KK = hour ? K * 8 : K;
    const ee = u === 'month' ? Math.min(e, KK) : e;
    return computeLadder({
      u,
      eu: hour ? 'hour' : 'day',
      e: String(ee),
      K: String(KK),
      M: String(M),
      C: String(C),
      b: String(b),
      t: String(t),
      a: String(a),
    });
  })
  .filter((r): r is LadderOk => r.ok);

/** the client's amount: below, at and above the floor, inside the ladder, at and above the opening, absent */
const amountArb = (l: LadderOk) =>
  fc.oneof(
    fc.constant(null),
    fc.bigInt({ min: 1n, max: l.floor > 1n ? l.floor - 1n : 1n }),
    fc.constant(l.floor),
    fc.bigInt({ min: l.floor, max: l.opening }),
    fc.constant(l.target),
    fc.constant(l.opening),
    fc.bigInt({ min: l.opening, max: l.opening * 3n }),
  );

const inputArb: fc.Arbitrary<PlanInput> = ladderArb.chain(
  (l) =>
    fc.record({
      ladder: fc.constant(l),
      deal: fc.record({
        quoteSent: fc.constantFrom(true, false, null),
        currentQuote: fc.oneof(fc.constant(null), fc.bigInt({ min: 1n, max: l.opening * 2n })),
      }),
      client: fc.record({
        move: fc.constantFrom(null, ...MOVES),
        objection: fc.constantFrom(null, ...OBJECTIONS),
        amount: amountArb(l),
        amountUnit: fc.constantFrom(
          l.unit,
          l.unit,
          'unspecified',
          null,
          'day',
          'hour',
          'month',
          'fixed',
        ),
        amountCurrency: fc.constantFrom('INR', 'INR', 'INR', 'OTHER', null),
        source: fc.constantFrom('analyser', 'manual'),
        confidence: fc.oneof(fc.constant(null), fc.double({ min: 0, max: 1, noNaN: true })),
      }),
      prefs: fc.record({
        condition: fc.constantFrom(null, ...CONDITIONS),
        advancePct: fc.constantFrom(...ADVANCE_PCTS),
        reducedEffort: fc.oneof(
          fc.constant(null),
          fc.integer({ min: 1, max: 400 }).map(String),
          fc.constantFrom('0', '-3', 'abc', '2.5', '1000'),
        ),
      }),
    }) as fc.Arbitrary<PlanInput>,
);

describe('planner properties (2,500 runs each)', () => {
  it('F-1: no offered or restated price is below the floor of the scope it prices', () => {
    fc.assert(
      fc.property(inputArb, (input) => {
        for (const o of planReplies(input).options)
          for (const a of o.allowed) {
            if (o.kind === 'DECLINE') continue; // the client's own number, quoted back to decline it
            const sc = o.figures.scope;
            const floor =
              a.slot === 'scope_price' && sc?.status === 'ready'
                ? sc.figures.floor
                : input.ladder.floor;
            expect(a.rupees).toBeGreaterThanOrEqual(floor);
            if (a.slot !== 'scope_price')
              expect(a.rupees).toBeGreaterThanOrEqual(input.ladder.floor);
          }
      }),
      { numRuns: RUNS },
    );
  });

  it('F-2: no client-facing figure equals the floor unless it is their number or your sent quote', () => {
    fc.assert(
      fc.property(inputArb, (input) => {
        const p = planReplies(input);
        for (const o of p.options)
          for (const a of o.allowed)
            if (a.rupees === input.ladder.floor && a.slot !== 'scope_price')
              expect(a.rupees === p.clientPrice || a.rupees === input.deal.currentQuote).toBe(true);
      }),
      { numRuns: RUNS },
    );
  });

  it('R-2: every number comes from the allowed set', () => {
    fc.assert(
      fc.property(inputArb, (input) => {
        const p = planReplies(input);
        const l = input.ladder;
        const P = p.yourPrice;
        const set = new Set<bigint>([l.floor, l.target, l.opening, P]);
        if (p.clientPrice !== null) set.add(p.clientPrice);
        const tc = tradeCounter(P, l.target, l.step);
        const sc = stepCounter(P, l.target, l.step);
        if (tc !== null) set.add(tc);
        if (sc !== null) set.add(sc);
        expect([l.floor, l.target, l.opening, P].includes(P)).toBe(true);
        if (input.deal.currentQuote !== null && P !== l.target && P !== l.opening)
          expect(P).toBe(input.deal.currentQuote);
        for (const o of p.options) {
          const sco = o.figures.scope;
          const local = new Set(set);
          if (sco?.status === 'ready')
            for (const v of [sco.figures.floor, sco.figures.target, sco.figures.opening])
              local.add(v);
          for (const a of o.allowed) expect(local.has(a.rupees)).toBe(true);
          for (const v of [
            o.figures.yourPrice,
            o.figures.counter,
            o.figures.clientPrice,
            o.figures.agreed,
          ])
            if (v !== null) expect(local.has(v)).toBe(true);
          if (o.figures.stepDown !== null)
            expect(o.figures.stepDown).toBe(o.figures.yourPrice! - o.figures.counter!);
          expect(o.figures.floorReminder).toBe(l.floor);
        }
      }),
      { numRuns: RUNS },
    );
  });

  it('N-1, G-1: 2 to 4 distinct options; the first is never a price cut with nothing asked back', () => {
    fc.assert(
      fc.property(inputArb, (input) => {
        const p = planReplies(input);
        expect(p.options.length).toBeGreaterThanOrEqual(2);
        expect(p.options.length).toBeLessThanOrEqual(4);
        expect(new Set(p.options.map((o) => o.kind)).size).toBe(p.options.length);
        expect(p.options[0]!.unconditionalConcession).toBe(false);
        p.options.forEach((o, i) => expect(o.rank).toBe(i + 1));
        for (const o of p.options)
          if (o.kind === 'TRADE' || o.kind === 'STEP') {
            expect(o.figures.counter!).toBeLessThan(p.yourPrice);
            expect(o.figures.counter!).toBeGreaterThanOrEqual(input.ladder.target);
          }
      }),
      { numRuns: RUNS },
    );
  });

  it('R-1: same input, same output', () => {
    fc.assert(
      fc.property(inputArb, (input) => {
        // a fresh copy of every plain part; the ladder keeps its Rational instances
        const again: PlanInput = {
          ladder: { ...input.ladder },
          deal: { ...input.deal },
          client: { ...input.client },
          prefs: { ...input.prefs },
        };
        const first = planReplies(input);
        expect(planReplies(again)).toEqual(first);
        expect(planReplies(input)).toEqual(first);
      }),
      { numRuns: RUNS },
    );
  });

  it('L-1: low-confidence analyser input still gives safe options, and says so', () => {
    fc.assert(
      fc.property(
        inputArb,
        fc.double({ min: 0, max: LOW_CONFIDENCE - 0.001, noNaN: true }),
        (input, conf) => {
          const low = {
            ...input,
            client: { ...input.client, source: 'analyser' as const, confidence: conf },
          };
          const p = planReplies(low);
          expect(p.row).toBe('L-1');
          expect(p.notes.some((n) => n === 'low_confidence' || n === 'no_move')).toBe(true);
          expect(p.clientPrice).toBeNull();
          for (const o of p.options) expect(['TRADE', 'HOLD', 'ASK', 'CLARIFY']).toContain(o.kind);
        },
      ),
      { numRuns: RUNS },
    );
  });
});
