/**
 * MolBhav design tokens v1.0 (LOCKED): the single source of truth for colour, glass, glow,
 * type, spacing, radius, elevation, motion and z-layers. `src/tokens.css` is generated from
 * this file (`npm run build:css -w packages/tokens`); a test fails if the two drift apart, and
 * the design-lock test fails if this file changes without a new changelog row in
 * docs/product/15_design_language.md.
 */

/** Bump with a new changelog row in docs/product/15_design_language.md §9. */
export const designVersion = '1.0';

/** Semantic colour roles. Names say what a colour is for, never what it looks like. */
export type ColorRole =
  | 'bg'
  | 'bgBand'
  | 'surface'
  | 'surfaceSunken'
  | 'surfaceRaised'
  | 'border'
  | 'borderStrong'
  | 'text'
  | 'textMuted'
  | 'textOnAccent'
  | 'accent'
  | 'accentDeep'
  | 'focus'
  | 'rungFloor'
  | 'rungTarget'
  | 'rungOpening'
  | 'chipBg'
  | 'chipText'
  | 'plannedText'
  | 'danger'
  | 'warningBg'
  | 'warningText'
  | 'sceneStone'
  | 'sceneCopper'
  | 'sceneGlow'
  | 'scenePost';

/**
 * Dark is the only theme. Sampled from the private concept art (docs/product/reference/,
 * never shipped) and tuned for contrast: provenance and every fix in 15 §4.
 */
export const color: Record<ColorRole, string> = {
  bg: '#0F0D0E',
  bgBand: '#141215',
  surface: '#1E1918',
  surfaceSunken: '#171314',
  surfaceRaised: '#2A2321',
  border: '#332B29',
  borderStrong: '#8C7C72',
  text: '#FDF5ED',
  textMuted: '#B8AFA9',
  textOnAccent: '#1A1210',
  accent: '#F7D2B0',
  accentDeep: '#E2A673',
  focus: '#FFD9B0',
  rungFloor: '#B9ABA2',
  rungTarget: '#EBB487',
  rungOpening: '#FFE2B5',
  chipBg: '#2E2622',
  chipText: '#F3D9C2',
  plannedText: '#D9C7F0',
  danger: '#FF9F8A',
  warningBg: '#33261A',
  warningText: '#F7D59E',
  sceneStone: '#85706A',
  sceneCopper: '#E2A673',
  sceneGlow: '#FFE2B5',
  scenePost: '#8C7C72',
};

/**
 * Glass: a warm tint at high opacity, so text on glass always meets AA even when the
 * brightest thing on the page (the accent) sits behind it. The test composites the fill over
 * `glass.worstBackdrop` and checks every text pair on the result.
 */
export const glass = {
  tint: '#1E1918',
  alpha: 0.86,
  strongAlpha: 0.94,
  border: '#F7D2B0',
  borderAlpha: 0.16,
  rim: '#FFE2B5',
  rimAlpha: 0.55,
  blur: '18px',
  worstBackdrop: '#F7D2B0',
} as const;

/** Peach-to-copper, top to bottom. Primary buttons and the opening rung. */
export const gradient = {
  from: '#F7D2B0',
  to: '#E2A673',
} as const;

/** Soft copper glow around the opening rung and the primary button on hover. */
export const glow = { color: '#F7B98A', alpha: 0.32, radius: '28px' } as const;

/** Text roles that may sit on glass (tested on the composited fill). */
export const onGlass: ColorRole[] = [
  'text',
  'textMuted',
  'accent',
  'rungFloor',
  'rungTarget',
  'rungOpening',
  'danger',
];

export type ContrastKind = 'text' | 'large' | 'ui';
/** WCAG 2.x AA minimums: body text 4.5:1, large text and UI components 3:1. */
export const minContrast: Record<ContrastKind, number> = { text: 4.5, large: 3, ui: 3 };

/**
 * Every foreground/background pair the app and site actually use. The tokens test computes
 * each ratio, and a scan fails if CSS uses a colour role as a foreground that is not listed.
 */
export const contrastPairs: { fg: ColorRole; bg: ColorRole; kind: ContrastKind; use: string }[] = [
  { fg: 'text', bg: 'bg', kind: 'text', use: 'body text on the page' },
  { fg: 'text', bg: 'bgBand', kind: 'text', use: 'text on showcase bands' },
  { fg: 'text', bg: 'surface', kind: 'text', use: 'text on cards and inputs' },
  { fg: 'text', bg: 'surfaceSunken', kind: 'text', use: 'trace and table text' },
  { fg: 'text', bg: 'surfaceRaised', kind: 'text', use: 'text on hovered controls' },
  { fg: 'textMuted', bg: 'bg', kind: 'text', use: 'hints and notes on the page' },
  { fg: 'textMuted', bg: 'bgBand', kind: 'text', use: 'pillar sub-text on bands' },
  { fg: 'textMuted', bg: 'surface', kind: 'text', use: 'hints on cards' },
  { fg: 'textMuted', bg: 'surfaceSunken', kind: 'text', use: 'muted text in the trace' },
  { fg: 'textMuted', bg: 'surfaceRaised', kind: 'text', use: 'unchosen option on hover' },
  { fg: 'textOnAccent', bg: 'accent', kind: 'text', use: 'primary button label (top)' },
  { fg: 'textOnAccent', bg: 'accentDeep', kind: 'text', use: 'primary button label (bottom)' },
  { fg: 'textOnAccent', bg: 'rungOpening', kind: 'text', use: 'text on the glowing opening' },
  { fg: 'accent', bg: 'bg', kind: 'text', use: 'links and italic emphasis on the page' },
  { fg: 'accent', bg: 'bgBand', kind: 'text', use: 'icons and links on bands' },
  { fg: 'accent', bg: 'surface', kind: 'text', use: 'links and secondary buttons on cards' },
  { fg: 'accent', bg: 'surfaceRaised', kind: 'text', use: 'secondary button label on hover' },
  { fg: 'chipText', bg: 'chipBg', kind: 'text', use: 'evidence label chips' },
  { fg: 'plannedText', bg: 'chipBg', kind: 'text', use: 'the Planned chip' },
  { fg: 'danger', bg: 'bg', kind: 'text', use: 'error messages on the page' },
  { fg: 'danger', bg: 'surface', kind: 'text', use: 'error messages on cards' },
  { fg: 'danger', bg: 'surfaceRaised', kind: 'text', use: 'danger button label on hover' },
  { fg: 'warningText', bg: 'warningBg', kind: 'text', use: 'the unusually-large warning' },
  { fg: 'rungFloor', bg: 'surfaceSunken', kind: 'text', use: 'floor rung on its stone card' },
  { fg: 'rungFloor', bg: 'surfaceRaised', kind: 'text', use: 'floor name on the lit stone edge' },
  { fg: 'rungFloor', bg: 'bg', kind: 'text', use: 'floor caption on the page' },
  { fg: 'rungTarget', bg: 'surface', kind: 'text', use: 'target rung on its glass card' },
  { fg: 'rungTarget', bg: 'surfaceSunken', kind: 'text', use: 'target name in the example card' },
  { fg: 'rungOpening', bg: 'surfaceSunken', kind: 'text', use: 'opening name in the example card' },
  { fg: 'rungTarget', bg: 'bg', kind: 'text', use: 'target caption on the page' },
  { fg: 'rungOpening', bg: 'surface', kind: 'text', use: 'opening rung name' },
  { fg: 'rungOpening', bg: 'bg', kind: 'text', use: 'opening caption on the page' },
  { fg: 'focus', bg: 'bg', kind: 'ui', use: 'focus ring on the page' },
  { fg: 'focus', bg: 'surface', kind: 'ui', use: 'focus ring on cards' },
  { fg: 'focus', bg: 'bgBand', kind: 'ui', use: 'focus ring on bands' },
  { fg: 'borderStrong', bg: 'surface', kind: 'ui', use: 'input borders' },
  { fg: 'borderStrong', bg: 'bg', kind: 'ui', use: 'outline button borders' },
  { fg: 'sceneStone', bg: 'bg', kind: 'ui', use: 'floor slab in the poster' },
  { fg: 'sceneCopper', bg: 'bg', kind: 'ui', use: 'target rung in the poster' },
  { fg: 'sceneGlow', bg: 'bg', kind: 'ui', use: 'opening rung in the poster' },
  { fg: 'scenePost', bg: 'bg', kind: 'ui', use: 'ladder upright in the poster' },
];

/** Self-hosted, SIL OFL 1.1 (licences recorded in docs/product/15_design_language.md §8). */
export const font = {
  text: "'IBM Plex Sans', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
  display: "'Fraunces Variable', 'IBM Plex Sans', Georgia, serif",
} as const;

export const fontWeight = { regular: '400', strong: '600' } as const;

/** Fluid type: sizes in rem at a 360 px and a 1280 px wide viewport. */
export const fluidRange = { minViewportRem: 22.5, maxViewportRem: 80 } as const;
export const typeScale = {
  xs: [0.8125, 0.875],
  sm: [0.875, 0.9375],
  md: [1, 1.0625],
  lg: [1.125, 1.25],
  xl: [1.375, 1.625],
  '2xl': [1.75, 2.25],
  '3xl': [2.25, 3.25],
  display: [2.5, 4.5],
} as const satisfies Record<string, readonly [number, number]>;
export type TypeStep = keyof typeof typeScale;

export const lineHeight = { tight: '1.08', snug: '1.3', body: '1.55' } as const;

export const space = {
  '0': '0',
  '1': '0.25rem',
  '2': '0.5rem',
  '3': '0.75rem',
  '4': '1rem',
  '5': '1.5rem',
  '6': '2rem',
  '7': '3rem',
  '8': '4rem',
  '9': '6rem',
} as const;

export const radius = { sm: '0.5rem', md: '0.875rem', lg: '1.5rem', pill: '999rem' } as const;

/** Dark only: deep, soft shadows under glass. */
export const elevation = {
  '0': 'none',
  '1': '0 1px 0 rgb(255 226 181 / 0.06) inset, 0 6px 18px rgb(0 0 0 / 0.35)',
  '2': '0 1px 0 rgb(255 226 181 / 0.1) inset, 0 18px 48px rgb(0 0 0 / 0.5)',
} as const;

/**
 * App motion is cause-and-effect only and ≤ 200 ms (08 intro). `slow` and `scene` are for
 * the showcase. Under prefers-reduced-motion every duration becomes 0 ms.
 */
export const motion = {
  duration: { instant: '0ms', fast: '120ms', base: '200ms', slow: '480ms', scene: '1200ms' },
  easing: {
    standard: 'cubic-bezier(0.2, 0, 0, 1)',
    settle: 'cubic-bezier(0.16, 1, 0.3, 1)',
    exit: 'cubic-bezier(0.4, 0, 1, 1)',
  },
} as const;

export const zLayer = {
  base: '0',
  raised: '10',
  sticky: '100',
  overlay: '1000',
  toast: '1100',
} as const;

export const kebab = (s: string): string => s.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);

const fmt = (n: number): string => String(Math.round(n * 10000) / 10000);

/** clamp(min, intercept + slope·vw, max): grows linearly between 360 px and 1280 px wide. */
export const fluid = ([min, max]: readonly [number, number]): string => {
  const { minViewportRem: a, maxViewportRem: b } = fluidRange;
  const slope = (max - min) / (b - a);
  const intercept = min - slope * a;
  return `clamp(${fmt(min)}rem, ${fmt(intercept)}rem + ${fmt(slope * 100)}vw, ${fmt(max)}rem)`;
};

/** '#RRGGBB' + alpha → 'rgb(r g b / a)'. */
export const rgba = (hex: string, a: number): string => {
  const v = hex.replace('#', '');
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(v.slice(i, i + 2), 16));
  return `rgb(${r} ${g} ${b} / ${a})`;
};

/** The CSS custom properties, generated from the values above. */
export const toCss = (): string => {
  const lines = [
    '/* Generated from packages/tokens/src/index.ts by scripts/build-css.ts. Do not edit. */',
    `/* MolBhav design tokens v${designVersion} (LOCKED). */`,
    ':root {',
    '  color-scheme: dark;',
    ...(Object.keys(color) as ColorRole[]).map((k) => `  --mb-color-${kebab(k)}: ${color[k]};`),
    `  --mb-glass-fill: ${rgba(glass.tint, glass.alpha)};`,
    `  --mb-glass-fill-strong: ${rgba(glass.tint, glass.strongAlpha)};`,
    `  --mb-glass-border: ${rgba(glass.border, glass.borderAlpha)};`,
    `  --mb-glass-rim: ${rgba(glass.rim, glass.rimAlpha)};`,
    `  --mb-glass-blur: ${glass.blur};`,
    `  --mb-gradient-accent: linear-gradient(180deg, ${gradient.from}, ${gradient.to});`,
    `  --mb-glow: 0 0 ${glow.radius} ${rgba(glow.color, glow.alpha)};`,
    `  --mb-glow-color: ${rgba(glow.color, glow.alpha)};`,
    ...Object.entries(elevation).map(([k, v]) => `  --mb-shadow-${k}: ${v};`),
    `  --mb-font-text: ${font.text};`,
    `  --mb-font-display: ${font.display};`,
    ...Object.entries(fontWeight).map(([k, v]) => `  --mb-weight-${k}: ${v};`),
    ...Object.entries(typeScale).map(([k, v]) => `  --mb-text-${k}: ${fluid(v)};`),
    ...Object.entries(lineHeight).map(([k, v]) => `  --mb-leading-${k}: ${v};`),
    ...Object.entries(space).map(([k, v]) => `  --mb-space-${k}: ${v};`),
    ...Object.entries(radius).map(([k, v]) => `  --mb-radius-${k}: ${v};`),
    ...Object.entries(motion.duration).map(([k, v]) => `  --mb-duration-${k}: ${v};`),
    ...Object.entries(motion.easing).map(([k, v]) => `  --mb-ease-${k}: ${v};`),
    ...Object.entries(zLayer).map(([k, v]) => `  --mb-z-${k}: ${v};`),
    '}',
    '@media (prefers-reduced-motion: reduce) {',
    '  :root {',
    ...Object.keys(motion.duration).map((k) => `    --mb-duration-${k}: 0ms;`),
    '  }',
    '}',
    '',
  ];
  return lines.join('\n');
};
