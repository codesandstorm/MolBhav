/**
 * The hero scene as data: camera, framing, geometry and the shading formulas. Pure (no three,
 * no DOM), so the live scene (LadderScene.tsx) and the build-time poster (Poster.astro) are
 * drawn from the same numbers, and the poster is the live scene's first frame by construction.
 *
 * Colours are the scene tokens, mixed by the shading functions below; the live shaders run the
 * same formulas in GLSL on raw sRGB values (no tone mapping, no colour management), so a
 * poster pixel and a live pixel come from the same arithmetic.
 */
import { color } from '@molbhav/tokens';

export type V3 = [number, number, number];
export type RGB = [number, number, number];

/* ── vector helpers ─────────────────────────────────────────────────── */
export const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
export const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
export const scale = (a: V3, s: number): V3 => [a[0] * s, a[1] * s, a[2] * s];
export const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
export const cross = (a: V3, b: V3): V3 => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
export const norm = (a: V3): V3 => {
  const l = Math.hypot(a[0], a[1], a[2]) || 1;
  return [a[0] / l, a[1] / l, a[2] / l];
};
/** Rotation about y, the same convention as three's `rotation.y`. */
export const rotY = (p: V3, a: number): V3 => {
  const c = Math.cos(a);
  const s = Math.sin(a);
  return [p[0] * c + p[2] * s, p[1], -p[0] * s + p[2] * c];
};

/* ── colours (sRGB 0–1) from the tokens ─────────────────────────────── */
export const rgb = (hex: string): RGB => {
  const n = parseInt(hex.slice(1), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
};
export const PALETTE = {
  stone: rgb(color.sceneStone),
  copper: rgb(color.sceneCopper),
  glow: rgb(color.sceneGlow),
  post: rgb(color.scenePost),
  raised: rgb(color.surfaceRaised),
  sunken: rgb(color.surfaceSunken),
} as const;
const mixc = (a: RGB, b: RGB, t: number): RGB => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
  a[2] + (b[2] - a[2]) * t,
];
const clamp1 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
export const hexOf = (c: RGB): string =>
  '#' +
  c
    .map((v) =>
      Math.round(clamp1(v) * 255)
        .toString(16)
        .padStart(2, '0'),
    )
    .join('');

/* ── camera and framing ─────────────────────────────────────────────── */
/**
 * The eye never moves to fit the stage: only the zoom changes. A perspective picture scaled
 * by zoom is the same picture scaled, so the SVG poster (fixed viewBox, "meet") and the live
 * canvas frame the scene identically at every stage size.
 */
export const CAMERA = { fov: 30, eye: [0, 1.0, 11] as V3, target: [0, -0.2, 0] as V3 };
/** World half-extents around the target that every stage shows. */
export const FRAME = { halfW: 2.0, halfH: 2.6 };
/** The poster's viewBox has the frame's aspect ratio. */
export const POSTER = { w: 400, h: 520 };
/** The ladder's ground in world space. */
export const GROUP_Y = -2.2;

const tanHalf = Math.tan((CAMERA.fov * Math.PI) / 360);
const DIST = Math.hypot(...sub(CAMERA.target, CAMERA.eye));

/** Zoom that shows the whole frame in a stage of this aspect (width / height). */
export const fitZoom = (aspect: number) =>
  (DIST * tanHalf) / Math.max(FRAME.halfH, FRAME.halfW / Math.max(aspect, 0.01));

const basis = (eye: V3, target: V3) => {
  const f = norm(sub(target, eye));
  const r = norm(cross(f, [0, 1, 0]));
  return { f, r, u: cross(r, f) };
};

/** World point → poster viewBox coordinates, plus its depth and units-per-world-unit there. */
export const projector = (eye: V3 = CAMERA.eye) => {
  const { f, r, u } = basis(eye, CAMERA.target);
  const aspect = POSTER.w / POSTER.h;
  const t = tanHalf / fitZoom(aspect);
  return (p: V3) => {
    const d = sub(p, eye);
    const z = dot(d, f);
    const x = dot(d, r) / (z * t * aspect);
    const y = dot(d, u) / (z * t);
    return {
      x: ((x + 1) / 2) * POSTER.w,
      y: ((1 - y) / 2) * POSTER.h,
      z,
      /** viewBox units per world unit at this depth */
      k: POSTER.h / 2 / (z * t),
    };
  };
};

/* ── lights ─────────────────────────────────────────────────────────── */
export const LIGHT = {
  /** warm key from above, front right */
  key: norm([0.45, 0.9, 0.55]),
  /** copper rim from behind left */
  rim: norm([-0.75, 0.3, -0.6]),
};

/* ── shading (the GLSL in LadderScene.tsx is a line-for-line copy) ──── */
/** Faceted stone: dim key light, copper fresnel rim, copper back light, warm top glow. */
export const shadeStone = (n: V3, v: V3, glow: number): RGB => {
  const diff = Math.max(dot(n, LIGHT.key), 0);
  const fr = (1 - Math.max(dot(n, v), 0)) ** 4;
  const back = Math.max(dot(n, LIGHT.rim), 0);
  const up = Math.max(n[1], 0);
  const s = PALETTE.stone;
  const c = PALETTE.copper;
  const g = PALETTE.glow;
  const k = 0.1 + 0.55 * diff * diff;
  const rim = 0.9 * fr + 0.7 * back * back * back;
  return [
    s[0] * k + c[0] * rim + g[0] * up * 0.1 * glow,
    s[1] * k + c[1] * rim + g[1] * up * 0.1 * glow,
    s[2] * k + c[2] * rim + g[2] * up * 0.1 * glow,
  ];
};

export interface GlassLook {
  tint: RGB;
  rim: RGB;
  base: number;
  power: number;
  spec: number;
}
export const GLASS = {
  rail: { tint: PALETTE.post, rim: PALETTE.glow, base: 0.3, power: 1.6, spec: 0.5 },
  target: { tint: PALETTE.raised, rim: PALETTE.copper, base: 0.4, power: 1.2, spec: 0.9 },
  ribbon: { tint: PALETTE.raised, rim: PALETTE.glow, base: 0.06, power: 2.2, spec: 0.7 },
} satisfies Record<string, GlassLook>;

/** Fake glass: tint inside, rim colour at grazing angles, a specular glint from the key. */
export const shadeGlass = (n: V3, v: V3, look: GlassLook): { c: RGB; a: number } => {
  const nv = Math.abs(dot(n, v));
  const f = (1 - nv) ** look.power;
  const nn = dot(n, v) < 0 ? scale(n, -1) : n;
  const h = norm(add(LIGHT.key, v));
  const sp = Math.max(dot(nn, h), 0) ** 40 * look.spec;
  const c = mixc(look.tint, look.rim, f);
  const up = Math.max(nn[1], 0) * 0.12;
  return {
    c: [c[0] + look.rim[0] * up + sp, c[1] + look.rim[1] * up + sp, c[2] + look.rim[2] * up + sp],
    a: clamp1(look.base + f * (1 - look.base) + sp),
  };
};

/** The rung of light: glowing core, copper at its edges. */
export const shadeLight = (n: V3, v: V3): RGB => {
  const t = Math.abs(dot(n, v)) ** 0.6;
  return mixc(PALETTE.copper, PALETTE.glow, 0.35 + 0.65 * t);
};

/** Halo alpha at a distance u (0 centre, 1 edge) from the opening rung. */
export const haloAlpha = (u: number, strength: number) =>
  u >= 1 ? 0 : 0.5 * strength * (1 - u) ** 2;

/* ── geometry ───────────────────────────────────────────────────────── */
export const RAIL = { x: 1.3, r: 0.055, h: 4.35 };
export const RUNG = { half: 1.2, r: 0.085 };
export const HALO = { rx: RUNG.half + 0.6, ry: 0.55 };

/** Seeded random numbers (mulberry32): the same stones every build. */
export const random = (seed: number) => {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

export type Tri = [V3, V3, V3];

const ICO_V: V3[] = (() => {
  const p = (1 + Math.sqrt(5)) / 2;
  return (
    [
      [-1, p, 0],
      [1, p, 0],
      [-1, -p, 0],
      [1, -p, 0],
      [0, -1, p],
      [0, 1, p],
      [0, -1, -p],
      [0, 1, -p],
      [p, 0, -1],
      [p, 0, 1],
      [-p, 0, -1],
      [-p, 0, 1],
    ] as V3[]
  ).map(norm);
})();
const ICO_F = [
  [0, 11, 5],
  [0, 5, 1],
  [0, 1, 7],
  [0, 7, 10],
  [0, 10, 11],
  [1, 5, 9],
  [5, 11, 4],
  [11, 10, 2],
  [10, 7, 6],
  [7, 1, 8],
  [3, 9, 4],
  [3, 4, 2],
  [3, 2, 6],
  [3, 6, 8],
  [3, 8, 9],
  [4, 9, 5],
  [2, 4, 11],
  [6, 2, 10],
  [8, 6, 7],
  [9, 8, 1],
] as const;

/**
 * A faceted rock: an icosahedron subdivided once, each vertex pushed in or out by a seeded
 * amount, the bottom cut flat so it sits on the ground. Unit size; centre at the origin.
 */
export const rock = (seed: number, jitter = 0.2, base = -0.5, detail = 1): Tri[] => {
  const rnd = random(seed);
  const verts: V3[] = [...ICO_V];
  const mid = new Map<string, number>();
  const midpoint = (a: number, b: number) => {
    const key = a < b ? `${a}_${b}` : `${b}_${a}`;
    const hit = mid.get(key);
    if (hit !== undefined) return hit;
    verts.push(norm(scale(add(verts[a]!, verts[b]!), 0.5)));
    mid.set(key, verts.length - 1);
    return verts.length - 1;
  };
  const faces: [number, number, number][] = [];
  for (const [a, b, c] of ICO_F) {
    if (detail === 0) {
      faces.push([a, b, c]);
      continue;
    }
    const ab = midpoint(a, b);
    const bc = midpoint(b, c);
    const ca = midpoint(c, a);
    faces.push([a, ab, ca], [b, bc, ab], [c, ca, bc], [ab, bc, ca]);
  }
  // a seeded orientation, so no stone shows the icosahedron's tip on top
  const ax = rnd() * Math.PI;
  const az = rnd() * Math.PI;
  const tilt = (v: V3): V3 => {
    const y1 = v[1] * Math.cos(ax) - v[2] * Math.sin(ax);
    const z1 = v[1] * Math.sin(ax) + v[2] * Math.cos(ax);
    return [v[0] * Math.cos(az) - y1 * Math.sin(az), v[0] * Math.sin(az) + y1 * Math.cos(az), z1];
  };
  const moved = verts.map((v) => {
    const r = 1 + (rnd() - 0.5) * 2 * jitter;
    const p = scale(tilt(v), r);
    return [p[0], Math.max(p[1], base), p[2]] as V3;
  });
  const tris: Tri[] = [];
  for (const [a, b, c] of faces) {
    const t: Tri = [moved[a]!, moved[b]!, moved[c]!];
    const n = cross(sub(t[1], t[0]), sub(t[2], t[0]));
    if (Math.hypot(...n) < 1e-6) continue; // collapsed by the flat cut
    const centre = scale(add(add(t[0], t[1]), t[2]), 1 / 3);
    tris.push(dot(n, centre) < 0 ? [t[0], t[2], t[1]] : t);
  }
  return tris;
};

export interface Placed {
  seed: number;
  at: V3;
  size: V3;
  turn: number;
}
/** Stones at the foot of the ladder (ladder space: ground at y = 0). Front stones overlap the rails. */
export const STONES: Placed[] = [
  { seed: 11, at: [-0.7, 0, 0.45], size: [0.82, 0.62, 0.66], turn: 0.5 },
  { seed: 23, at: [0.42, 0, -0.35], size: [0.78, 0.7, 0.6], turn: 1.2 },
  { seed: 37, at: [1.45, 0, 0.55], size: [0.5, 0.38, 0.46], turn: 2.1 },
  { seed: 41, at: [-1.72, 0, 0.3], size: [0.42, 0.3, 0.4], turn: 0.9 },
];
const ROCK_BASE = -0.5;

/** A rock's triangles moved into ladder space (sitting on y = 0). */
export const placeRock = (s: Placed): Tri[] =>
  rock(s.seed, 0.24, ROCK_BASE, 0).map(
    (t) =>
      t.map((p) => {
        const q = rotY(
          [p[0] * s.size[0], (p[1] - ROCK_BASE) * s.size[1], p[2] * s.size[2]],
          s.turn,
        );
        return add(q, s.at);
      }) as Tri,
  );

/** The floor rung: a flat slab of the same stone, centred on its height. */
export const SLAB = { seed: 7, size: [1.3, 0.2, 0.42] as V3 };
export const slab = (): Tri[] =>
  rock(SLAB.seed, 0.12, -1, 0).map(
    (t) => t.map((p) => [p[0] * SLAB.size[0], p[1] * SLAB.size[1], p[2] * SLAB.size[2]]) as Tri,
  );

export const faceNormal = (t: Tri): V3 => norm(cross(sub(t[1], t[0]), sub(t[2], t[0])));

/* ── the glass ribbon around the ladder ─────────────────────────────── */
export const RIBBON = { segments: 120, rx: 1.8, rz: 1.15, cy: 2.35, tilt: 0.55, wave: 0.3, w: 0.3 };

export interface RibbonPoint {
  p: V3;
  /** across the ribbon (unit) */
  side: V3;
}
/** Points along the ribbon's centre line (ladder space), with the direction across it. */
export const ribbonPath = (): RibbonPoint[] => {
  const out: RibbonPoint[] = [];
  const { segments, rx, rz, cy, tilt, wave } = RIBBON;
  for (let i = 0; i <= segments; i++) {
    const s = (i / segments) * Math.PI * 2;
    const p: V3 = [
      rx * Math.cos(s),
      cy + tilt * Math.cos(s) + wave * Math.sin(2 * s + 0.6),
      rz * Math.sin(s),
    ];
    const out_: V3 = norm([Math.cos(s), 0, Math.sin(s)]);
    const twist = s; // one full turn of twist: closes without a seam
    out.push({
      p,
      side: norm(add(scale([0, 1, 0], Math.cos(twist)), scale(out_, Math.sin(twist)))),
    });
  }
  return out;
};

/* ── dust motes ─────────────────────────────────────────────────────── */
export const MOTES = { count: 120, rise: 0.06, box: { x: 2.1, y0: 0.4, y1: 4.6, z: 1.3 } };
export interface Mote {
  at: V3;
  size: number;
  alpha: number;
  phase: number;
}
export const motes = (): Mote[] => {
  const rnd = random(5);
  const { x, y0, y1, z } = MOTES.box;
  return Array.from({ length: MOTES.count }, () => ({
    at: [(rnd() * 2 - 1) * x, y0 + rnd() * (y1 - y0), (rnd() * 2 - 1) * z] as V3,
    size: 0.012 + rnd() * 0.022,
    alpha: 0.18 + rnd() * 0.4,
    phase: rnd() * Math.PI * 2,
  }));
};
