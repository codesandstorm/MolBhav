import { computeLadder, formatINR, type LadderInput } from '@molbhav/engine';

/**
 * The showcase's example deal: the same made-up inputs as the app's "Try an example deal"
 * (apps/app/src/form.ts exampleForm; a test keeps them equal). Shown as "Example (made up)".
 * Inputs are never printed on the page; only the engine's outputs are.
 */
export const EXAMPLE: LadderInput = {
  u: 'fixed',
  eu: 'day',
  e: '7',
  K: '18',
  M: '90000',
  C: '3000',
  b: '',
  t: '20',
  a: '15',
};

export type RungId = 'floor' | 'target' | 'opening';

export interface HeroRung {
  id: RungId;
  /** formatted by the engine, e.g. "₹38,000" */
  value: string;
  /** height relative to the opening, in thousandths (integer division in BigInt) */
  permille: number;
}

export interface HeroLadder {
  rungs: HeroRung[];
  /** concession room, a whole percent from the engine (spec 13 v0.3 §3.5) */
  roomPct: string;
  noRoom: boolean;
}

/** Runs at build time inside Astro: every number on the page comes from here. */
export const heroLadder = (): HeroLadder => {
  const r = computeLadder(EXAMPLE);
  if (!r.ok) throw new Error(`example deal is invalid: ${r.error}`);
  const rung = (id: RungId, v: bigint): HeroRung => ({
    id,
    value: formatINR(v),
    permille: Number((v * 1000n) / r.opening),
  });
  return {
    rungs: [rung('floor', r.floor), rung('target', r.target), rung('opening', r.opening)],
    roomPct: `${r.concessionRoomPct}%`,
    noRoom: r.opening === r.target,
  };
};
