import { Rational } from './rational.ts';
import { formatDecimal, formatINR, formatINRExact } from './format.ts';

/** Raw input as it arrives from a form or a JSON file. Numbers or numeric strings. */
export interface LadderInput {
  u?: unknown;
  eu?: unknown;
  e?: unknown;
  K?: unknown;
  M?: unknown;
  C?: unknown;
  b?: unknown;
  t?: unknown;
  a?: unknown;
  Q?: unknown;
}

export type Unit = 'fixed' | 'hour' | 'month';
export type EffortUnit = 'day' | 'hour';
export type ErrorCode =
  | 'u_invalid'
  | 'eu_invalid'
  | 'e_missing'
  | 'e_out_of_range'
  | 'K_out_of_range'
  | 'M_out_of_range'
  | 'C_out_of_range'
  | 'b_out_of_range'
  | 't_out_of_range'
  | 'a_out_of_range'
  | 'not_whole_rupees'
  | 'e_exceeds_K'
  | 'hour_costs_need_e';
export type Warning = 'unusually_large';
export type QuotePosition =
  'below_floor' | 'floor_to_target' | 'target_to_opening' | 'at_or_above_opening';
export type QuoteResult =
  | { position: QuotePosition; differenceFromFloor: bigint }
  | { error: 'Q_out_of_range' | 'not_whole_rupees' };

export interface TraceStep {
  id: string;
  /** what was done, in words, with its inputs (each input number is a USER DECISION) */
  expression: string;
  /** the result, formatted; "≈" marks a display rounding of an exact value */
  result: string;
  label: 'CALCULATION';
}

/** Validated, exact inputs (after defaults). */
export interface ExactInputs {
  u: Unit;
  eu?: EffortUnit;
  e?: Rational;
  K: Rational;
  M: Rational;
  C: Rational;
  b: bigint;
  t: bigint;
  a: bigint;
}

export interface LadderOk {
  ok: true;
  unit: Unit;
  step: bigint;
  floor: bigint;
  target: bigint;
  opening: bigint;
  exact: { floor: Rational; target: Rational; opening: Rational };
  concessionRoomPct: bigint;
  label: 'CALCULATION';
  trace: TraceStep[];
  warnings: Warning[];
  quote: QuoteResult | null;
  inputs: ExactInputs;
}
export interface LadderErr {
  ok: false;
  error: ErrorCode;
}
export type LadderResult = LadderOk | LadderErr;

const MAX_RUPEES = 100_000_000n; // ₹10,00,00,000
const WARN_FLOOR = 10_000_000n; // ₹1,00,00,000

const isMissing = (v: unknown): boolean =>
  v === undefined || v === null || (typeof v === 'string' && v.trim() === '');

/** Number or numeric string → exact Rational; commas are accepted in strings (spec 13 §6). */
const toRational = (v: unknown): Rational | null => {
  if (typeof v === 'number' || typeof v === 'bigint') return Rational.parse(String(v));
  if (typeof v === 'string') {
    const s = v.trim();
    if (!/^[+-]?[\d,]*\d(\.\d+)?$/.test(s) && !/^[+-]?\d+(\.\d+)?[eE][+-]?\d+$/.test(s))
      return null;
    return Rational.parse(s.replace(/,/g, ''));
  }
  return null;
};

const decimalsAtMost = (x: Rational, places: bigint): boolean => {
  const p = x.decimalPlaces();
  return p !== null && p <= places;
};

const inRange = (x: Rational, lo: Rational, hi: Rational): boolean =>
  x.cmp(lo) >= 0 && x.cmp(hi) <= 0;

type Check<T> = { ok: true; value: T } | { ok: false; error: ErrorCode };

const rupees = (v: unknown, min: bigint, code: ErrorCode): Check<Rational> => {
  const x = toRational(v);
  if (x === null || !x.isInteger()) return { ok: false, error: 'not_whole_rupees' };
  if (!inRange(x, Rational.of(min), Rational.of(MAX_RUPEES))) return { ok: false, error: code };
  return { ok: true, value: x };
};

const percent = (v: unknown, max: bigint, dflt: bigint, code: ErrorCode): Check<bigint> => {
  if (isMissing(v)) return { ok: true, value: dflt };
  const x = toRational(v);
  if (x === null || !x.isInteger() || x.n < 0n || x.n > max) return { ok: false, error: code };
  return { ok: true, value: x.n };
};

/** Spec 13 §5.2: checks in a fixed order; the first failure is returned. */
export const validate = (i: LadderInput): Check<ExactInputs> => {
  // 1
  if (i.u !== 'fixed' && i.u !== 'hour' && i.u !== 'month')
    return { ok: false, error: 'u_invalid' };
  const u: Unit = i.u;
  // 2
  let eu: EffortUnit;
  if (u === 'hour') {
    if (!isMissing(i.eu) && i.eu !== 'hour') return { ok: false, error: 'eu_invalid' };
    eu = 'hour';
  } else {
    if (i.eu !== 'day' && i.eu !== 'hour') return { ok: false, error: 'eu_invalid' };
    eu = i.eu;
  }
  // 3, 4
  let e: Rational | undefined;
  if (isMissing(i.e)) {
    if (u !== 'hour') return { ok: false, error: 'e_missing' };
  } else {
    const x = toRational(i.e);
    if (
      x === null ||
      x.cmp(Rational.of(0n)) <= 0 ||
      x.cmp(Rational.of(10_000n)) > 0 ||
      !decimalsAtMost(x, 2n)
    )
      return { ok: false, error: 'e_out_of_range' };
    e = x;
  }
  // 5
  const K = isMissing(i.K) ? null : toRational(i.K);
  const kMax = Rational.of(eu === 'day' ? 31n : 744n);
  if (K === null || !decimalsAtMost(K, 2n) || !inRange(K, Rational.of(1n), kMax))
    return { ok: false, error: 'K_out_of_range' };
  // 6
  if (isMissing(i.M)) return { ok: false, error: 'M_out_of_range' };
  const M = rupees(i.M, 1n, 'M_out_of_range');
  if (!M.ok) return M;
  // 7
  let C = Rational.of(0n);
  if (!isMissing(i.C)) {
    const c = rupees(i.C, 0n, 'C_out_of_range');
    if (!c.ok) return c;
    C = c.value;
  }
  // 8, 9
  const b = percent(i.b, 100n, 0n, 'b_out_of_range');
  if (!b.ok) return b;
  const t = percent(i.t, 300n, 20n, 't_out_of_range');
  if (!t.ok) return t;
  const a = percent(i.a, 300n, 15n, 'a_out_of_range');
  if (!a.ok) return a;
  // 10
  if (u === 'month' && e !== undefined && e.cmp(K) > 0) return { ok: false, error: 'e_exceeds_K' };
  // 11
  if (u === 'hour' && e === undefined && C.cmp(Rational.of(0n)) > 0)
    return { ok: false, error: 'hour_costs_need_e' };

  const value: ExactInputs = { u, eu, K, M: M.value, C, b: b.value, t: t.value, a: a.value };
  if (e !== undefined) value.e = e;
  return { ok: true, value };
};

const pct = (p: bigint): Rational => Rational.of(100n + p, 100n);

/** Spec 13 §3.1–3.3 on exact, already-validated inputs. Exported for big-value tests. */
export const ladderCore = (x: ExactInputs) => {
  const step = x.u === 'hour' ? 10n : 100n;
  const buffer = pct(x.b);
  let floorExact: Rational;
  if (x.e === undefined) {
    // hour, no total hours (C = 0 by validation)
    floorExact = x.M.mul(buffer).div(x.K);
  } else {
    const E = x.e.mul(buffer);
    const L = x.M.mul(E).div(x.K);
    const total = L.add(x.C);
    floorExact = x.u === 'hour' ? total.div(x.e) : total;
  }
  const targetExact = floorExact.mul(pct(x.t));
  const openingExact = targetExact.mul(pct(x.a));
  return {
    step,
    floorExact,
    targetExact,
    openingExact,
    floor: floorExact.ceilToStep(step),
    target: targetExact.ceilToStep(step),
    opening: openingExact.ceilToStep(step),
  };
};

const money = (r: Rational): string => {
  const f = formatINRExact(r);
  return (f.approx ? '≈ ' : '') + f.text;
};
const num = (r: Rational): string => {
  const f = formatDecimal(r);
  return (f.approx ? '≈ ' : '') + f.text;
};

const buildTrace = (
  x: ExactInputs,
  c: ReturnType<typeof ladderCore>,
  room: bigint,
): TraceStep[] => {
  const unitWord = x.eu === 'hour' ? 'hours' : 'days';
  const perUnit = x.u === 'hour' ? '/hour' : x.u === 'month' ? '/month' : '';
  const steps: TraceStep[] = [];
  const add = (id: string, expression: string, result: string) =>
    steps.push({ id, expression, result, label: 'CALCULATION' });
  if (x.e === undefined) {
    add(
      'rate',
      `${formatINR(x.M.n)} ÷ ${num(x.K)} billable hours × (1 + ${x.b}% buffer)`,
      money(c.floorExact) + perUnit,
    );
  } else {
    const E = x.e.mul(pct(x.b));
    const L = x.M.mul(E).div(x.K);
    add('buffered', `${num(x.e)} ${unitWord} × (1 + ${x.b}% buffer)`, `${num(E)} ${unitWord}`);
    add('labour', `${formatINR(x.M.n)} × ${num(E)} ÷ ${num(x.K)} billable ${unitWord}`, money(L));
    add('total', `${money(L)} + ${formatINR(x.C.n)} costs`, money(L.add(x.C)));
    if (x.u === 'hour')
      add('per_hour', `${money(L.add(x.C))} ÷ ${num(x.e)} hours`, money(c.floorExact) + perUnit);
  }
  add('floor', `floor rounded up to ${formatINR(c.step)}`, formatINR(c.floor) + perUnit);
  add(
    'target',
    `${money(c.floorExact)} × (1 + ${x.t}%), rounded up to ${formatINR(c.step)}`,
    formatINR(c.target) + perUnit,
  );
  add(
    'opening',
    `${money(c.targetExact)} × (1 + ${x.a}%), rounded up to ${formatINR(c.step)}`,
    formatINR(c.opening) + perUnit,
  );
  add(
    'room',
    `(${formatINR(c.opening)} − ${formatINR(c.target)}) ÷ ${formatINR(c.opening)}, rounded down to a whole percent`,
    c.opening === c.target ? 'no room at this price' : `${room}%`,
  );
  return steps;
};

const quoteFor = (q: unknown, f: bigint, t: bigint, o: bigint): QuoteResult | null => {
  if (isMissing(q)) return null;
  const x = toRational(q);
  if (x === null || !x.isInteger()) return { error: 'not_whole_rupees' };
  if (x.n < 1n || x.n > MAX_RUPEES) return { error: 'Q_out_of_range' };
  const Q = x.n;
  const position: QuotePosition =
    Q < f
      ? 'below_floor'
      : Q < t
        ? 'floor_to_target'
        : Q < o
          ? 'target_to_opening'
          : 'at_or_above_opening';
  return { position, differenceFromFloor: Q - f };
};

/** Spec 13 v0.3 §3.5: ⌊100 × (O − T) / O⌋ from the rounded rungs; 0 when O = T. */
export const concessionRoomPct = (target: bigint, opening: bigint): bigint =>
  opening <= target ? 0n : (100n * (opening - target)) / opening;

export const computeLadder = (input: LadderInput): LadderResult => {
  const v = validate(input);
  if (!v.ok) return { ok: false, error: v.error };
  const x = v.value;
  const c = ladderCore(x);
  const room = concessionRoomPct(c.target, c.opening);
  return {
    ok: true,
    unit: x.u,
    step: c.step,
    floor: c.floor,
    target: c.target,
    opening: c.opening,
    exact: { floor: c.floorExact, target: c.targetExact, opening: c.openingExact },
    concessionRoomPct: room,
    label: 'CALCULATION',
    trace: buildTrace(x, c, room),
    warnings: c.floor > WARN_FLOOR ? ['unusually_large'] : [],
    quote: quoteFor(input.Q, c.floor, c.target, c.opening),
    inputs: x,
  };
};
