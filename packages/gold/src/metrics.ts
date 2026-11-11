/**
 * Agreement and evaluation metrics (docs/product/04_research_integrity.md §2.2).
 * Every function is unit-tested against hand-computed values (test/metrics.test.ts).
 *
 * Conventions:
 * - macro-F1 averages per-class F1 over the classes present in gold or predictions (the
 *   union), so a class predicted but never true still counts against the score;
 * - a class with fewer than 10 test items is reported as "too few to score";
 * - bootstrap: 2,000 resamples with replacement, seed 42, 95% percentile intervals
 *   (linear-interpolation quantiles, "type 7");
 * - the paired bootstrap draws the same resamples for both systems; a model ships only if
 *   the lower bound of Δ = metric(model) − metric(baseline) is above 0.
 */
import { rng } from './rng.ts';

export const MIN_SUPPORT = 10;
export const RESAMPLES = 2000;
export const SEED = 42;
/** the 97.5th percentile of the standard normal */
export const Z95 = 1.959963984540054;

const assertSameLength = (a: readonly unknown[], b: readonly unknown[]) => {
  if (a.length !== b.length) throw new Error(`length mismatch: ${a.length} vs ${b.length}`);
};

export const accuracy = <T>(gold: readonly T[], pred: readonly T[]): number => {
  assertSameLength(gold, pred);
  if (gold.length === 0) return Number.NaN;
  let ok = 0;
  for (let i = 0; i < gold.length; i++) if (gold[i] === pred[i]) ok++;
  return ok / gold.length;
};

/** Labels in a stable order: the given order first, then any others in order of appearance. */
export const labelsOf = <T>(gold: readonly T[], pred: readonly T[], order: readonly T[] = []) => {
  const out = [...order.filter((l) => gold.includes(l) || pred.includes(l))];
  for (const x of [...gold, ...pred]) if (!out.includes(x)) out.push(x);
  return out;
};

/** rows = gold, columns = predicted */
export const confusion = <T>(gold: readonly T[], pred: readonly T[], labels: readonly T[]) => {
  assertSameLength(gold, pred);
  const m = labels.map(() => labels.map(() => 0));
  for (let i = 0; i < gold.length; i++) {
    const r = labels.indexOf(gold[i]!);
    const c = labels.indexOf(pred[i]!);
    if (r < 0 || c < 0)
      throw new Error(`label not in the list: ${String(gold[i])}/${String(pred[i])}`);
    m[r]![c]!++;
  }
  return m;
};

export interface ClassScore<T> {
  label: T;
  support: number;
  precision: number;
  recall: number;
  f1: number;
  /** support below MIN_SUPPORT: report it, but don't score it */
  tooFew: boolean;
}

export const perClass = <T>(gold: readonly T[], pred: readonly T[], order: readonly T[] = []) => {
  const labels = labelsOf(gold, pred, order);
  return labels.map((label): ClassScore<T> => {
    let tp = 0;
    let fp = 0;
    let fn = 0;
    for (let i = 0; i < gold.length; i++) {
      if (pred[i] === label && gold[i] === label) tp++;
      else if (pred[i] === label) fp++;
      else if (gold[i] === label) fn++;
    }
    const precision = tp + fp === 0 ? 0 : tp / (tp + fp);
    const recall = tp + fn === 0 ? 0 : tp / (tp + fn);
    const f1 = precision + recall === 0 ? 0 : (2 * precision * recall) / (precision + recall);
    const support = tp + fn;
    return { label, support, precision, recall, f1, tooFew: support < MIN_SUPPORT };
  });
};

export const macroF1 = <T>(gold: readonly T[], pred: readonly T[]): number => {
  assertSameLength(gold, pred);
  const scores = perClass(gold, pred);
  if (scores.length === 0) return Number.NaN;
  return scores.reduce((s, c) => s + c.f1, 0) / scores.length;
};

/** Cohen's κ between two raters; null when it is undefined (both raters constant and equal). */
export const cohenKappa = <T>(a: readonly T[], b: readonly T[]): number | null => {
  assertSameLength(a, b);
  const n = a.length;
  if (n === 0) return null;
  const labels = labelsOf(a, b);
  let agree = 0;
  for (let i = 0; i < n; i++) if (a[i] === b[i]) agree++;
  const po = agree / n;
  let pe = 0;
  for (const l of labels) {
    const pa = a.filter((x) => x === l).length / n;
    const pb = b.filter((x) => x === l).length / n;
    pe += pa * pb;
  }
  if (pe === 1) return null;
  return (po - pe) / (1 - pe);
};

/** Wilson score interval for k successes in n trials. */
export const wilson = (k: number, n: number, z = Z95) => {
  if (n === 0) return null;
  const p = k / n;
  const z2 = z * z;
  const denom = 1 + z2 / n;
  const centre = (p + z2 / (2 * n)) / denom;
  const half = (z * Math.sqrt((p * (1 - p)) / n + z2 / (4 * n * n))) / denom;
  return { p, lo: Math.max(0, centre - half), hi: Math.min(1, centre + half) };
};

/** Linear-interpolation quantile ("type 7") of an already sorted array. */
export const quantile = (sorted: readonly number[], q: number): number => {
  if (sorted.length === 0) return Number.NaN;
  const h = (sorted.length - 1) * q;
  const lo = Math.floor(h);
  const hi = Math.ceil(h);
  return sorted[lo]! + (h - lo) * (sorted[hi]! - sorted[lo]!);
};

/** The same resample index lists for every caller with the same n and seed. */
export const resampleIndices = (n: number, resamples = RESAMPLES, seed = SEED): number[][] => {
  const r = rng(seed);
  const out: number[][] = [];
  for (let b = 0; b < resamples; b++) {
    const idx = new Array<number>(n);
    for (let i = 0; i < n; i++) idx[i] = Math.floor(r() * n);
    out.push(idx);
  }
  return out;
};

export type Metric<T> = (gold: readonly T[], pred: readonly T[]) => number;

export interface Interval {
  point: number;
  lo: number;
  hi: number;
  resamples: number;
  seed: number;
}

const pick = <T>(xs: readonly T[], idx: readonly number[]) => idx.map((i) => xs[i]!);
const finite = (xs: number[]) => xs.filter((x) => Number.isFinite(x)).sort((x, y) => x - y);

/** 95% percentile bootstrap interval of a metric over the test items. */
export const bootstrap = <T>(
  gold: readonly T[],
  pred: readonly T[],
  metric: Metric<T>,
  resamples = RESAMPLES,
  seed = SEED,
): Interval => {
  assertSameLength(gold, pred);
  const vals = finite(
    resampleIndices(gold.length, resamples, seed).map((idx) =>
      metric(pick(gold, idx), pick(pred, idx)),
    ),
  );
  return {
    point: metric(gold, pred),
    lo: quantile(vals, 0.025),
    hi: quantile(vals, 0.975),
    resamples,
    seed,
  };
};

/**
 * Paired bootstrap of Δ = metric(model) − metric(baseline) on the same resamples
 * (04 §2.2 decision rule). `ships` is true only if the lower bound of the interval is > 0.
 */
export const pairedBootstrap = <T>(
  gold: readonly T[],
  model: readonly T[],
  baseline: readonly T[],
  metric: Metric<T>,
  resamples = RESAMPLES,
  seed = SEED,
) => {
  assertSameLength(gold, model);
  assertSameLength(gold, baseline);
  const deltas = finite(
    resampleIndices(gold.length, resamples, seed).map((idx) => {
      const g = pick(gold, idx);
      return metric(g, pick(model, idx)) - metric(g, pick(baseline, idx));
    }),
  );
  const lo = quantile(deltas, 0.025);
  return {
    delta: metric(gold, model) - metric(gold, baseline),
    lo,
    hi: quantile(deltas, 0.975),
    resamples,
    seed,
    ships: lo > 0,
  };
};

export interface AmountKey {
  rupees: string | null;
  rupees_high: string | null;
}
const amountKey = (a: AmountKey) => `${a.rupees ?? '-'}|${a.rupees_high ?? '-'}`;

/**
 * Exact amount match (A4): rupees and the range's high end must both match; "no amount" must
 * match "no amount". Reported over all items and over the items whose gold has an amount,
 * each with a Wilson 95% interval.
 */
export const exactAmountMatch = (gold: readonly AmountKey[], pred: readonly AmountKey[]) => {
  assertSameLength(gold, pred);
  let all = 0;
  let withAmount = 0;
  let withAmountOk = 0;
  for (let i = 0; i < gold.length; i++) {
    const ok = amountKey(gold[i]!) === amountKey(pred[i]!);
    if (ok) all++;
    if (gold[i]!.rupees !== null) {
      withAmount++;
      if (ok) withAmountOk++;
    }
  }
  return {
    all: { k: all, n: gold.length, ci: wilson(all, gold.length) },
    withAmount: { k: withAmountOk, n: withAmount, ci: wilson(withAmountOk, withAmount) },
  };
};

/** κ per labelled field between two label sets for the same messages (same order). */
export interface FieldLabels {
  move: string;
  objection: string;
  conditional: boolean | null;
  amount: AmountKey & { unit: string | null };
}
export const kappaPerField = (a: readonly FieldLabels[], b: readonly FieldLabels[]) => {
  assertSameLength(a, b);
  const both = a
    .map((x, i) => [x, b[i]!] as const)
    .filter(([x, y]) => x.conditional !== null && y.conditional !== null);
  return {
    move: cohenKappa(
      a.map((x) => x.move),
      b.map((x) => x.move),
    ),
    objection: cohenKappa(
      a.map((x) => x.objection),
      b.map((x) => x.objection),
    ),
    /** only on messages both raters call CONCESSION */
    conditional: {
      n: both.length,
      kappa: cohenKappa(
        both.map(([x]) => String(x.conditional)),
        both.map(([, y]) => String(y.conditional)),
      ),
    },
    amount: cohenKappa(
      a.map((x) => `${amountKey(x.amount)}|${x.amount.unit ?? '-'}`),
      b.map((x) => `${amountKey(x.amount)}|${x.amount.unit ?? '-'}`),
    ),
  };
};
