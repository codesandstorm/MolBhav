/**
 * Builds the poster at build time: the live scene's first frame (scroll position 0, no
 * pointer), projected from the same scene model with the same shading. Painter's order
 * matches the live render order: back half of the ribbon, rails, stones and slab, target,
 * opening and its halo, front half of the ribbon, dust motes.
 */
import { pose } from './choreography.ts';
import type { RungId } from './example.ts';
import {
  CAMERA,
  GLASS,
  GROUP_Y,
  HALO,
  PALETTE,
  RAIL,
  RIBBON,
  RUNG,
  STONES,
  add,
  cross,
  dot,
  faceNormal,
  haloAlpha,
  hexOf,
  motes,
  norm,
  placeRock,
  projector,
  ribbonPath,
  rotY,
  scale,
  shadeGlass,
  shadeLight,
  shadeStone,
  slab,
  sub,
  type GlassLook,
  type RGB,
  type Tri,
  type V3,
} from './scene-model.ts';

const r1 = (n: number) => Math.round(n * 10) / 10;
const r3 = (n: number) => Math.round(n * 1000) / 1000;

export const posterMarkup = (permille: Record<RungId, number>): string => {
  const s = pose(0, permille);
  const world = (p: V3): V3 => add(rotY(p, s.yaw), [0, GROUP_Y, 0]);
  const proj = projector();
  const eye = CAMERA.eye;
  const viewFrom = (p: V3) => norm(sub(eye, p));
  const defs: string[] = [];
  const out: string[] = [];
  let id = 0;

  /** A cylinder (rail or rung) as a round-capped line with a gradient across it. */
  const cylinder = (
    a: V3,
    b: V3,
    radius: number,
    shade: (n: V3, v: V3) => { c: RGB; a: number },
  ) => {
    const A = world(a);
    const B = world(b);
    const axis = norm(sub(B, A));
    const mid = scale(add(A, B), 0.5);
    const v = viewFrom(mid);
    const vp = norm(sub(v, scale(axis, dot(v, axis))));
    const bp = norm(cross(axis, vp));
    const g0 = proj(add(mid, scale(bp, -radius)));
    const g1 = proj(add(mid, scale(bp, radius)));
    const stops: string[] = [];
    for (let i = 0; i <= 16; i++) {
      const th = -Math.PI / 2 + (i / 16) * Math.PI;
      const n = norm(add(scale(vp, Math.cos(th)), scale(bp, Math.sin(th))));
      const { c, a: al } = shade(n, v);
      stops.push(
        `<stop offset="${r3((Math.sin(th) + 1) / 2)}" stop-color="${hexOf(c)}" stop-opacity="${r3(al)}"/>`,
      );
    }
    const gid = `pg${id++}`;
    defs.push(
      `<linearGradient id="${gid}" gradientUnits="userSpaceOnUse" x1="${r1(g0.x)}" y1="${r1(g0.y)}" x2="${r1(g1.x)}" y2="${r1(g1.y)}">${stops.join('')}</linearGradient>`,
    );
    const pa = proj(A);
    const pb = proj(B);
    const w = Math.hypot(g1.x - g0.x, g1.y - g0.y);
    out.push(
      `<line x1="${r1(pa.x)}" y1="${r1(pa.y)}" x2="${r1(pb.x)}" y2="${r1(pb.y)}" stroke="url(#${gid})" stroke-width="${r1(w)}" stroke-linecap="round"/>`,
    );
  };
  const glass = (look: GlassLook) => (n: V3, v: V3) => shadeGlass(n, v, look);

  /** Opaque faceted solids, back faces culled, far faces first. */
  const solids = (tris: Tri[]) => {
    const faces = tris
      .map((t) => {
        const w = t.map(world) as Tri;
        const n = faceNormal(w);
        const c = scale(add(add(w[0], w[1]), w[2]), 1 / 3);
        const v = viewFrom(c);
        return { w, n, v, depth: proj(c).z };
      })
      .filter((f) => dot(f.n, f.v) > 0)
      .sort((p, q) => q.depth - p.depth);
    for (const f of faces) {
      const col = hexOf(shadeStone(f.n, f.v, s.glow));
      const pts = f.w.map((p) => proj(p)).map((p) => `${r1(p.x)},${r1(p.y)}`);
      out.push(
        `<polygon points="${pts.join(' ')}" fill="${col}" stroke="${col}" stroke-width=".6"/>`,
      );
    }
  };

  /** One half of the glass ribbon: translucent quads, far first. */
  const path = ribbonPath();
  const ribbon = (front: boolean) => {
    const quads: { pts: V3[]; depth: number; n: V3; v: V3 }[] = [];
    for (let i = 0; i < path.length - 1; i++) {
      const a = path[i]!;
      const b = path[i + 1]!;
      if (a.p[2] + b.p[2] > 0 !== front) continue;
      const hw = RIBBON.w / 2;
      const pts = [
        add(a.p, scale(a.side, -hw)),
        add(b.p, scale(b.side, -hw)),
        add(b.p, scale(b.side, hw)),
        add(a.p, scale(a.side, hw)),
      ].map(world);
      const centre = scale(add(pts[0]!, pts[2]!), 0.5);
      const n = norm(cross(sub(pts[1]!, pts[0]!), sub(pts[3]!, pts[0]!)));
      quads.push({ pts, depth: proj(centre).z, n, v: viewFrom(centre) });
    }
    quads.sort((p, q) => q.depth - p.depth);
    for (const q of quads) {
      const { c, a } = shadeGlass(q.n, q.v, GLASS.ribbon);
      const pts = q.pts.map((p) => proj(p)).map((p) => `${r1(p.x)},${r1(p.y)}`);
      out.push(`<polygon points="${pts.join(' ')}" fill="${hexOf(c)}" fill-opacity="${r3(a)}"/>`);
    }
  };

  ribbon(false);
  for (const x of [-RAIL.x, RAIL.x]) cylinder([x, 0, 0], [x, RAIL.h, 0], RAIL.r, glass(GLASS.rail));
  solids([
    ...STONES.flatMap(placeRock),
    ...slab().map((t) => t.map((p) => add(p, [0, s.floorY, 0])) as Tri),
  ]);
  const rung = (y: number, width: number) => [
    [-RUNG.half * width, y, 0] as V3,
    [RUNG.half * width, y, 0] as V3,
  ];
  const [t0, t1] = rung(s.targetY, s.targetWidth);
  cylinder(t0, t1, RUNG.r, glass(GLASS.target));
  const [o0, o1] = rung(s.openingY, s.openingWidth);
  cylinder(o0, o1, RUNG.r, (n, v) => ({ c: shadeLight(n, v), a: 1 }));

  // halo: a quad in the rung's plane with an elliptical falloff, added to what is behind it
  const hc = world([0, s.openingY, 0]);
  const pc = proj(hc);
  const px = proj(world([HALO.rx * s.openingWidth, s.openingY, 0]));
  const py = proj(world([0, s.openingY + HALO.ry, 0]));
  const haloStops = Array.from({ length: 11 }, (_, i) => {
    const u = i / 10;
    return `<stop offset="${u}" stop-color="${hexOf(PALETTE.glow)}" stop-opacity="${r3(haloAlpha(u, s.glow))}"/>`;
  }).join('');
  defs.push(
    `<radialGradient id="ph" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse">${haloStops}</radialGradient>`,
  );
  out.push(
    `<circle r="1" fill="url(#ph)" class="blend-light" transform="matrix(${r3(px.x - pc.x)} ${r3(px.y - pc.y)} ${r3(py.x - pc.x)} ${r3(py.y - pc.y)} ${r1(pc.x)} ${r1(pc.y)})"/>`,
  );

  ribbon(true);

  // dust motes, where they start
  const moteStops = Array.from({ length: 6 }, (_, i) => {
    const u = i / 5;
    return `<stop offset="${u}" stop-color="${hexOf(PALETTE.glow)}" stop-opacity="${r3((1 - u) ** 2)}"/>`;
  }).join('');
  defs.push(`<radialGradient id="pm">${moteStops}</radialGradient>`);
  const dots = motes().map((m) => {
    const p = proj(world(m.at));
    return `<circle cx="${r1(p.x)}" cy="${r1(p.y)}" r="${r3(m.size * p.k)}" fill="url(#pm)" opacity="${r3(m.alpha)}"/>`;
  });
  out.push(`<g class="blend-light">${dots.join('')}</g>`);

  return `<defs>${defs.join('')}</defs>${out.join('')}`;
};
