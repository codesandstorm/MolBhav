import { describe, expect, it } from 'vitest';
import {
  accuracy,
  bootstrap,
  cohenKappa,
  confusion,
  exactAmountMatch,
  kappaPerField,
  macroF1,
  pairedBootstrap,
  perClass,
  quantile,
  resampleIndices,
  wilson,
} from '../src/metrics.ts';

/*
 * The worked example used below (hand-computed):
 *   gold = A A A B B C
 *   pred = A A B B C C
 * accuracy: 4 correct of 6 → 4/6 = 0.666667
 * confusion (rows gold, columns pred, order A B C):
 *   A: 2 1 0
 *   B: 0 1 1
 *   C: 0 0 1
 * A: tp 2, fp 0, fn 1 → P = 2/2 = 1, R = 2/3,  F1 = 2·1·(2/3)/(1+2/3) = (4/3)/(5/3) = 0.8
 * B: tp 1, fp 1, fn 1 → P = 1/2,      R = 1/2,  F1 = 0.5
 * C: tp 1, fp 1, fn 0 → P = 1/2,      R = 1,    F1 = 2·0.5·1/1.5 = 2/3
 * macro-F1 = (0.8 + 0.5 + 2/3)/3 = 1.966667/3 = 0.655556
 * Cohen's κ(gold, pred): po = 4/6; marginals gold A 3/6 B 2/6 C 1/6, pred A 2/6 B 2/6 C 2/6
 *   pe = (3·2 + 2·2 + 1·2)/36 = 12/36 = 1/3; κ = (2/3 − 1/3)/(1 − 1/3) = (1/3)/(2/3) = 0.5
 */
const gold = ['A', 'A', 'A', 'B', 'B', 'C'];
const pred = ['A', 'A', 'B', 'B', 'C', 'C'];

describe('classification metrics (hand-computed)', () => {
  it('accuracy', () => expect(accuracy(gold, pred)).toBeCloseTo(4 / 6, 12));

  it('confusion matrix', () =>
    expect(confusion(gold, pred, ['A', 'B', 'C'])).toEqual([
      [2, 1, 0],
      [0, 1, 1],
      [0, 0, 1],
    ]));

  it('per-class precision, recall, F1 and support, with "too few to score"', () => {
    const s = perClass(gold, pred, ['A', 'B', 'C']);
    expect(s.map((c) => c.label)).toEqual(['A', 'B', 'C']);
    expect(s[0]).toMatchObject({ support: 3, precision: 1, tooFew: true });
    expect(s[0]!.recall).toBeCloseTo(2 / 3, 12);
    expect(s[0]!.f1).toBeCloseTo(0.8, 12);
    expect(s[1]).toMatchObject({ support: 2, precision: 0.5, recall: 0.5, f1: 0.5 });
    expect(s[2]).toMatchObject({ support: 1, precision: 0.5, recall: 1 });
    expect(s[2]!.f1).toBeCloseTo(2 / 3, 12);
  });

  it('a class with 10 or more test items is scored', () => {
    // 10 × A all correct: support 10 → tooFew false
    const g = Array(10).fill('A');
    expect(perClass(g, g)[0]).toMatchObject({ support: 10, f1: 1, tooFew: false });
  });

  it('macro-F1', () => expect(macroF1(gold, pred)).toBeCloseTo((0.8 + 0.5 + 2 / 3) / 3, 12));

  it('macro-F1 counts a class that is only predicted (union of labels)', () => {
    // gold A A, pred A X: A: P 1, R 1/2, F1 2/3; X: P 0, R 0 (no gold X), F1 0 → (2/3 + 0)/2 = 1/3
    expect(macroF1(['A', 'A'], ['A', 'X'])).toBeCloseTo(1 / 3, 12);
  });

  it("Cohen's κ", () => expect(cohenKappa(gold, pred)).toBeCloseTo(0.5, 12));

  it("Cohen's κ: perfect agreement is 1, agreement at chance level is 0", () => {
    expect(cohenKappa(['A', 'B', 'A', 'B'], ['A', 'B', 'A', 'B'])).toBe(1);
    // a = A A B B, b = A B A B: po = 2/4 = 0.5; pe = (2·2 + 2·2)/16 = 0.5 → κ = 0
    expect(cohenKappa(['A', 'A', 'B', 'B'], ['A', 'B', 'A', 'B'])).toBe(0);
  });

  it("Cohen's κ is undefined when both raters always give the same single label", () =>
    expect(cohenKappa(['A', 'A'], ['A', 'A'])).toBeNull());
});

describe('Wilson 95% interval (hand-computed)', () => {
  it('8 of 10', () => {
    /*
     * p = 0.8, z = 1.959964, z² = 3.841459, z²/n = 0.3841459, denominator 1.3841459
     * centre = (0.8 + 3.841459/20)/1.3841459 = 0.9920729/1.3841459 = 0.716740
     * half   = 1.959964 · √(0.8·0.2/10 + 3.841459/400)/1.3841459
     *        = 1.959964 · √(0.016 + 0.009603648)/1.3841459 = 1.959964 · 0.1600114/1.3841459 = 0.226577
     * → [0.490163, 0.943317]
     */
    const w = wilson(8, 10)!;
    expect(w.p).toBe(0.8);
    expect(w.lo).toBeCloseTo(0.490163, 5);
    expect(w.hi).toBeCloseTo(0.943317, 5);
  });

  it('0 of 10 stays inside [0, 1]', () => {
    // p = 0: centre = (3.841459/20)/1.3841459 = 0.1920730/1.3841459 = 0.138766
    //        half = 1.959964·√(3.841459/400)/1.3841459 = (3.841459/20)/1.3841459 = 0.138766
    // → [0, 0.277533]
    const w = wilson(0, 10)!;
    expect(w.lo).toBeCloseTo(0, 6);
    expect(w.hi).toBeCloseTo(0.277533, 5);
  });

  it('no items → no interval', () => expect(wilson(0, 0)).toBeNull());
});

describe('bootstrap', () => {
  it('linear-interpolation quantiles (hand-computed)', () => {
    // [1..5], q = 0.5: h = 4·0.5 = 2 → 3
    expect(quantile([1, 2, 3, 4, 5], 0.5)).toBe(3);
    // [10,20,30,40], q = 0.25: h = 3·0.25 = 0.75 → 10 + 0.75·10 = 17.5
    expect(quantile([10, 20, 30, 40], 0.25)).toBe(17.5);
    // q = 0.975 of [0,1]: h = 0.975 → 0.975
    expect(quantile([0, 1], 0.975)).toBeCloseTo(0.975, 12);
  });

  it('draws 2,000 resamples with seed 42, the same every time', () => {
    const a = resampleIndices(60);
    expect(a).toHaveLength(2000);
    expect(a.every((idx) => idx.length === 60 && idx.every((i) => i >= 0 && i < 60))).toBe(true);
    expect(resampleIndices(60)).toEqual(a);
    expect(resampleIndices(60, 2000, 7)).not.toEqual(a);
  });

  it('a perfect system has the interval [1, 1]; the point estimate lies inside the interval', () => {
    const g = ['A', 'B', 'C', 'A', 'B', 'C', 'A', 'B', 'C', 'A'];
    expect(bootstrap(g, g, accuracy)).toMatchObject({
      point: 1,
      lo: 1,
      hi: 1,
      resamples: 2000,
      seed: 42,
    });
    const b = bootstrap(gold, pred, accuracy);
    expect(b.point).toBeCloseTo(4 / 6, 12);
    expect(b.lo).toBeLessThanOrEqual(b.point);
    expect(b.hi).toBeGreaterThanOrEqual(b.point);
    expect(b.lo).toBeGreaterThanOrEqual(0);
    expect(b.hi).toBeLessThanOrEqual(1);
  });

  it('paired bootstrap: identical systems give Δ = 0 and do not ship', () => {
    const p = pairedBootstrap(gold, pred, pred, macroF1);
    expect(p).toMatchObject({ delta: 0, lo: 0, hi: 0, ships: false });
  });

  it('paired bootstrap: a model right on every item beats an always-wrong baseline', () => {
    // model = gold → macro-F1 1 on every resample; baseline wrong everywhere → macro-F1 0 → Δ = 1
    const g = ['A', 'B', 'A', 'B', 'A', 'B', 'A', 'B'];
    const wrong = g.map((x) => (x === 'A' ? 'B' : 'A'));
    const p = pairedBootstrap(g, g, wrong, macroF1);
    expect(p).toMatchObject({ delta: 1, lo: 1, hi: 1, ships: true });
  });

  it('paired bootstrap: Δ is the difference of the two point scores', () => {
    // macroF1(gold, gold) = 1; macroF1(gold, pred) = 0.655556 → Δ = 0.344444
    const p = pairedBootstrap(gold, gold, pred, macroF1);
    expect(p.delta).toBeCloseTo(1 - (0.8 + 0.5 + 2 / 3) / 3, 12);
    expect(p.lo).toBeLessThanOrEqual(p.delta);
  });
});

describe('exact amount match (A4)', () => {
  it('counts rupees and the range end; "no amount" matches "no amount"', () => {
    const g = [
      { rupees: '45000', rupees_high: null },
      { rupees: '40000', rupees_high: '45000' },
      { rupees: null, rupees_high: null },
      { rupees: '150000', rupees_high: null },
    ];
    const p = [
      { rupees: '45000', rupees_high: null }, // match
      { rupees: '40000', rupees_high: null }, // range end missing: no match
      { rupees: null, rupees_high: null }, // match
      { rupees: '15000', rupees_high: null }, // no match
    ];
    const r = exactAmountMatch(g, p);
    // all items: 2 of 4; items with a gold amount: 1 of 3
    expect(r.all).toMatchObject({ k: 2, n: 4 });
    expect(r.withAmount).toMatchObject({ k: 1, n: 3 });
    expect(r.all.ci!.p).toBe(0.5);
  });
});

describe('κ per field', () => {
  it('moves, objections, amounts, and conditional only where both raters say CONCESSION', () => {
    const amt = (rupees: string | null) => ({
      rupees,
      rupees_high: null,
      unit: rupees ? 'fixed' : null,
    });
    const a = [
      { move: 'CONCESSION', objection: 'NONE', conditional: true, amount: amt('40000') },
      { move: 'CONCESSION', objection: 'BUDGET', conditional: false, amount: amt(null) },
      { move: 'PUSHBACK', objection: 'BUDGET', conditional: null, amount: amt(null) },
    ];
    const b = [
      { move: 'CONCESSION', objection: 'NONE', conditional: true, amount: amt('40000') },
      { move: 'CONCESSION', objection: 'BUDGET', conditional: true, amount: amt(null) },
      { move: 'OTHER', objection: 'BUDGET', conditional: null, amount: amt(null) },
    ];
    const k = kappaPerField(a, b);
    // move: a = C C P, b = C C O: po = 2/3; pe = (2/3·2/3) + 0 + 0 = 4/9; κ = (2/3 − 4/9)/(5/9) = 0.4
    expect(k.move).toBeCloseTo(0.4, 12);
    // objection: identical, two labels → 1
    expect(k.objection).toBe(1);
    // conditional: rows 1–2 only; a = T F, b = T T: po = 1/2; pe = (1/2·1) + (1/2·0) = 1/2 → κ = 0
    expect(k.conditional).toEqual({ n: 2, kappa: 0 });
    expect(k.amount).toBe(1);
  });
});
