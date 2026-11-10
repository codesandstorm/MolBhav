/**
 * Scroll progress (0 → 1) → the pose of the hero ladder. Pure, so it is unit-tested and the
 * poster can be drawn from the same state. Heights are the engine's per-mille values.
 *
 * p = 0 is the hero: the ladder stands assembled, exactly as the poster draws it, so the
 * live scene can replace the poster without a visible jump. Leaving the hero, the floor
 * settles onto the stones and the upper rungs fold into it; the story then raises them one
 * by one: floor, target, opening.
 */
export interface Pose {
  floorY: number;
  floorLift: number;
  targetY: number;
  targetWidth: number;
  openingY: number;
  openingWidth: number;
  glow: number;
  yaw: number;
}

export const LADDER_HEIGHT = 3.6;
/** Where a settled rung rests: on the stones at the foot of the ladder. */
export const GROUND_Y = 0.32;

export const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
const span = (p: number, a: number, b: number) => clamp01((p - a) / (b - a));
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export const heightOf = (permille: number) => (LADDER_HEIGHT * permille) / 1000;

/** The scroll windows of each beat (also used by the captions' tests). */
export const BEATS = {
  settle: [0.02, 0.16],
  floor: [0.24, 0.46],
  target: [0.46, 0.68],
  opening: [0.68, 0.9],
} as const;

export const pose = (
  p: number,
  permille: { floor: number; target: number; opening: number },
): Pose => {
  const settle = easeInOut(span(p, ...BEATS.settle));
  const rise = (beat: readonly [number, number]) =>
    Math.max(1 - settle, easeInOut(span(p, ...beat)));
  const f = rise(BEATS.floor);
  const t = rise(BEATS.target);
  const o = rise(BEATS.opening);
  // each rung grows out of the one below it, so the order floor ≤ target ≤ opening always holds
  const floorY = lerp(GROUND_Y, heightOf(permille.floor), f);
  const targetY = lerp(floorY, heightOf(permille.target), t);
  return {
    floorY,
    floorLift: f,
    targetY,
    targetWidth: lerp(0.05, 1, t),
    openingY: lerp(targetY, heightOf(permille.opening), o),
    openingWidth: lerp(0.05, 1, o),
    glow: o,
    yaw: lerp(-0.32, 0.22, easeInOut(clamp01(p))),
  };
};

/** Where the visitor's eye rests while reading a caption: 60 % down the viewport. */
export const READ_LINE = 0.6;

export interface Box {
  top: number;
  height: number;
}
/** Positions in page coordinates (scroll offset already added). */
export interface StoryLayout {
  storyTop: number;
  steps: readonly [Box, Box, Box];
  end: number;
}

/**
 * Scroll anchors for `piecewise`: each rung finishes rising when the middle of its caption
 * reaches the reading line, so picture and words always agree, at any width.
 */
export const anchorsFor = (l: StoryLayout, vh: number): [number, number][] => {
  const read = (b: Box) => b.top + b.height / 2 - vh * READ_LINE;
  const [floor, target, opening] = l.steps;
  return [
    [0, 0],
    [l.storyTop - vh, BEATS.settle[1]],
    [floor.top - vh * 0.9, BEATS.floor[0]],
    [read(floor), BEATS.floor[1]],
    [read(target), BEATS.target[1]],
    [read(opening), BEATS.opening[1]],
    [l.end - vh * 0.7, 1],
  ];
};
