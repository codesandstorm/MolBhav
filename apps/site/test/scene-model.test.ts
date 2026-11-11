import { describe, expect, it } from 'vitest';
import { gzipSync } from 'node:zlib';
import {
  CAMERA,
  FRAME,
  MOTES,
  POSTER,
  RIBBON,
  STONES,
  dot,
  faceNormal,
  fitZoom,
  hexOf,
  motes,
  placeRock,
  projector,
  ribbonPath,
  rock,
  scale,
  add,
  shadeStone,
  sub,
  norm,
  type V3,
} from '../src/lib/scene-model.ts';
import { posterMarkup } from '../src/lib/poster.ts';
import { heroLadder } from '../src/lib/example.ts';

const permille = Object.fromEntries(heroLadder().rungs.map((r) => [r.id, r.permille])) as Record<
  'floor' | 'target' | 'opening',
  number
>;

describe('framing', () => {
  it('the camera target lands in the middle of the poster', () => {
    const p = projector()(CAMERA.target);
    expect(p.x).toBeCloseTo(POSTER.w / 2, 6);
    expect(p.y).toBeCloseTo(POSTER.h / 2, 6);
  });
  it('the poster viewBox has the frame’s aspect ratio', () => {
    expect(POSTER.w / POSTER.h).toBeCloseTo(FRAME.halfW / FRAME.halfH, 2);
  });
  it('zoom fits height on wide stages and width on narrow ones, and never shows less', () => {
    const wide = fitZoom(2);
    const tall = fitZoom(0.5);
    expect(wide).toBeGreaterThan(tall);
    expect(fitZoom(FRAME.halfW / FRAME.halfH)).toBeCloseTo(wide, 6);
  });
});

describe('stones', () => {
  it('are seeded: the same triangles every build', () => {
    expect(rock(11)).toEqual(rock(11));
    expect(rock(11)).not.toEqual(rock(12));
  });
  it('every face points outwards and each stone sits on the ground', () => {
    for (const s of STONES) {
      const tris = placeRock(s);
      const centre = tris
        .flat()
        .reduce((a, p) => add(a, p), [0, 0, 0] as V3)
        .map((v) => v / (tris.length * 3)) as V3;
      for (const t of tris) {
        const c = scale(add(add(t[0], t[1]), t[2]), 1 / 3);
        expect(dot(faceNormal(t), sub(c, centre))).toBeGreaterThan(-1e-9);
      }
      const lowest = Math.min(...tris.flat().map((p) => p[1]));
      expect(lowest).toBeCloseTo(0, 6);
    }
  });
  it('faces turned to the camera edge-on get the copper rim; facing faces stay dark', () => {
    const v = norm([0, 0, 1]);
    const edge = shadeStone(norm([1, -0.2, 0.05]), v, 1);
    const facing = shadeStone(v, v, 1);
    expect(edge[0]).toBeGreaterThan(facing[0]);
    expect(hexOf([2, -1, 0.5])).toBe('#ff0080');
  });
});

describe('ribbon and motes', () => {
  it('the ribbon closes on itself without a seam', () => {
    const p = ribbonPath();
    expect(p).toHaveLength(RIBBON.segments + 1);
    const first = p[0]!;
    const last = p.at(-1)!;
    for (let i = 0; i < 3; i++) {
      expect(last.p[i]).toBeCloseTo(first.p[i]!, 9);
      expect(last.side[i]).toBeCloseTo(first.side[i]!, 9);
    }
  });
  it('at most 150 motes, seeded, inside their box', () => {
    const m = motes();
    expect(m.length).toBeLessThanOrEqual(150);
    expect(m).toEqual(motes());
    for (const x of m) {
      expect(x.at[1]).toBeGreaterThanOrEqual(MOTES.box.y0);
      expect(x.at[1]).toBeLessThanOrEqual(MOTES.box.y1);
    }
  });
});

describe('poster', () => {
  const svg = posterMarkup(permille);
  it('is the same markup every build', () => {
    expect(posterMarkup(permille)).toBe(svg);
  });
  it('draws every layer of the live scene in its render order', () => {
    const at = (s: string) => svg.indexOf(s);
    expect(at('<polygon')).toBeGreaterThan(-1); // ribbon and stones
    expect(at('stroke-linecap="round"')).toBeGreaterThan(-1); // rails and rungs
    expect(at('url(#ph)')).toBeGreaterThan(at('stroke-linecap="round"')); // halo after rungs
    expect(at('url(#pm)')).toBeGreaterThan(at('url(#ph)')); // motes last
  });
  it('stays small: under 20 KB gzipped', () => {
    expect(gzipSync(svg).length).toBeLessThan(20 * 1024);
  });
});
