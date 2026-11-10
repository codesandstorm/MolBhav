import { describe, expect, it } from 'vitest';
import { piecewise } from '../src/lib/scroll-progress.ts';
import { anchorsFor, BEATS, GROUND_Y, heightOf, pose, READ_LINE } from '../src/lib/choreography.ts';

const pm = { floor: 723, target: 868, opening: 1000 };

describe('hero choreography', () => {
  it('starts assembled, exactly as the poster draws it (no jump when the scene takes over)', () => {
    const start = pose(0, pm);
    expect(start.floorY).toBeCloseTo(heightOf(723), 9);
    expect(start.targetY).toBeCloseTo(heightOf(868), 9);
    expect(start.openingY).toBeCloseTo(heightOf(1000), 9);
    expect(start.targetWidth).toBe(1);
    expect(start.openingWidth).toBe(1);
  });
  it('settles every rung to the ground after the hero', () => {
    const s = pose(BEATS.settle[1], pm);
    expect(s.floorY).toBeCloseTo(GROUND_Y, 9);
    expect(s.targetY).toBeCloseTo(GROUND_Y, 9);
    expect(s.openingY).toBeCloseTo(GROUND_Y, 9);
  });
  it('raises the rungs in order: floor, then target, then opening', () => {
    const afterFloor = pose(BEATS.floor[1], pm);
    expect(afterFloor.floorY).toBeCloseTo(heightOf(723), 9);
    expect(afterFloor.targetY).toBeCloseTo(heightOf(723), 9); // folded into the floor
    expect(afterFloor.targetWidth).toBeCloseTo(0.05, 9);
    const afterTarget = pose(BEATS.target[1], pm);
    expect(afterTarget.targetY).toBeCloseTo(heightOf(868), 9);
    expect(afterTarget.openingY).toBeCloseTo(heightOf(868), 9);
    expect(afterTarget.openingWidth).toBeCloseTo(0.05, 9);
  });
  it('ends with every rung at its engine height, the opening fully lit', () => {
    const end = pose(1, pm);
    expect(end.floorY).toBeCloseTo(heightOf(723), 9);
    expect(end.targetY).toBeCloseTo(heightOf(868), 9);
    expect(end.openingY).toBeCloseTo(heightOf(1000), 9);
    expect(end.glow).toBe(1);
  });
  it('keeps floor ≤ target ≤ opening at every scroll position', () => {
    for (let i = 0; i <= 400; i++) {
      const s = pose(i / 400, pm);
      expect(s.floorY).toBeLessThanOrEqual(s.targetY + 1e-9);
      expect(s.targetY).toBeLessThanOrEqual(s.openingY + 1e-9);
    }
  });
  it('clamps progress outside 0..1', () => {
    expect(pose(7, pm)).toEqual(pose(1, pm));
    expect(pose(-3, pm)).toEqual(pose(0, pm));
  });
});

describe('story anchors', () => {
  const vh = 800;
  const layout = {
    storyTop: 1200,
    steps: [
      { top: 1500, height: 600 },
      { top: 2100, height: 600 },
      { top: 2700, height: 600 },
    ],
    end: 3600,
  } as const;
  const a = anchorsFor(layout, vh);
  const atCaption = (i: 0 | 1 | 2) => {
    const s = layout.steps[i];
    return s.top + s.height / 2 - vh * READ_LINE;
  };
  it('each rung is fully raised when its caption reaches the reading line', () => {
    expect(pose(piecewise(atCaption(0), a), pm).floorY).toBeCloseTo(heightOf(723), 9);
    expect(pose(piecewise(atCaption(1), a), pm).targetY).toBeCloseTo(heightOf(868), 9);
    expect(pose(piecewise(atCaption(2), a), pm).openingY).toBeCloseTo(heightOf(1000), 9);
  });
  it('the next rung has not started while the previous caption is being read', () => {
    expect(pose(piecewise(atCaption(0), a), pm).targetWidth).toBeCloseTo(0.05, 9);
    expect(pose(piecewise(atCaption(1), a), pm).openingWidth).toBeCloseTo(0.05, 9);
  });
  it('the page top is the assembled hero', () => expect(piecewise(0, a)).toBe(0));
});
