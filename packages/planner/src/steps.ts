/**
 * Concession arithmetic (docs/product/18_planner_rules.md, rules S-1 to S-4). Exact bigint only:
 * prices are whole rupees, and every result is rounded UP to the ladder step, as the engine
 * rounds its rungs (docs/product/13_price_ladder_spec.md §3.3).
 */

/** ceil_s(n / d) × s for n ≥ 0, d > 0: the smallest multiple of s that is ≥ n / d. */
export const ceilToStep = (n: bigint, d: bigint, s: bigint): bigint => {
  const q = d * s;
  return ((n + q - 1n) / q) * s;
};

/**
 * S-1 · the next step from your price P towards your target T: the midpoint, rounded up to the
 * step, so it never goes below T. Null when that is not lower than P (no step left).
 */
export const stepCounter = (P: bigint, T: bigint, s: bigint): bigint | null => {
  if (P <= T) return null;
  const c = ceilToStep(P + T, 2n, s);
  return c < P ? c : null;
};

/**
 * S-2 · a trade moves less than a step: a quarter of the way from P to T, rounded up to the
 * step (P − ¼(P − T) = (3P + T) / 4). Null when that is not lower than P.
 */
export const tradeCounter = (P: bigint, T: bigint, s: bigint): bigint | null => {
  if (P <= T) return null;
  const c = ceilToStep(3n * P + T, 4n, s);
  return c < P ? c : null;
};

/**
 * S-3 · the whole decreasing sequence of steps from P: P > c₁ > c₂ > … ≥ T. Each step is at most
 * the one before it (tested in steps.test.ts). Used to document and test the rule; the planner
 * offers the first step only.
 */
export const concessionSteps = (P: bigint, T: bigint, s: bigint): bigint[] => {
  const out: bigint[] = [];
  let p = P;
  for (let c = stepCounter(p, T, s); c !== null; c = stepCounter(p, T, s)) {
    out.push(c);
    p = c;
  }
  return out;
};
