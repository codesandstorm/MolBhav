/** Layout of the quote track on the ladder screen (pure, so it is unit-tested). */
/** Track ends sit this far (per cent) inside the box, so end ticks and labels never clip. */
export const PAD = 6;
/** Labels closer than this (per cent of the track) would collide, so they are spread apart. */
export const LABEL_GAP = 24;

/**
 * Position of `v` on a track from `lo` to `hi`, in per cent of the track width. Worked in
 * BigInt per-mille (no floats on money); only the final screen position is a number.
 */
export const place = (v: bigint, lo: bigint, hi: bigint): number => {
  if (hi <= lo) return 50;
  const pm = ((v - lo) * 1000n) / (hi - lo);
  return PAD + (Number(pm < 0n ? 0n : pm > 1000n ? 1000n : pm) * (100 - 2 * PAD)) / 1000;
};

/** Spreads three ordered label positions so neighbours keep LABEL_GAP between them. */
export const spread = (xs: readonly [number, number, number]): [number, number, number] => {
  const min = PAD + 4;
  const max = 100 - PAD - 4;
  const l0 = Math.max(xs[0], min);
  const l1 = Math.max(xs[1], l0 + LABEL_GAP);
  const l2 = Math.min(Math.max(xs[2], l1 + LABEL_GAP), max);
  const m1 = Math.min(l1, l2 - LABEL_GAP);
  return [Math.max(Math.min(l0, m1 - LABEL_GAP), min), m1, l2];
};
