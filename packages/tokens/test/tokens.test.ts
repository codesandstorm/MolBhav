import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { createHash } from 'node:crypto';
import {
  color,
  contrastPairs,
  designVersion,
  glass,
  kebab,
  minContrast,
  onGlass,
  toCss,
  type ColorRole,
} from '../src/index.ts';

const root = join(import.meta.dirname, '..', '..', '..');

/** WCAG 2.x relative luminance and contrast ratio. */
const luminance = (hex: string): number => {
  const v = hex.replace('#', '');
  const [r, g, b] = [0, 2, 4].map((i) => {
    const c = parseInt(v.slice(i, i + 2), 16) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
export const contrast = (a: string, b: string): number => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
};

describe('contrast (WCAG AA) for every pair in use', () => {
  it('the formula matches known values', () => {
    expect(contrast('#000000', '#FFFFFF')).toBeCloseTo(21, 5);
    expect(contrast('#777777', '#FFFFFF')).toBeCloseTo(4.48, 2);
  });
  for (const p of contrastPairs)
    it(`${p.fg} on ${p.bg} (${p.kind}, ${p.use})`, () => {
      const ratio = contrast(color[p.fg], color[p.bg]);
      expect(ratio, `${ratio.toFixed(2)}:1`).toBeGreaterThanOrEqual(minContrast[p.kind]);
    });
});

/**
 * Interactive states (hover, focus-visible, active, checked, error). Each row names the CSS
 * rule that creates the state and the foreground/surface pair it produces, so the pair list
 * covers states and not only default looks. The coverage test below fails when a state rule in
 * the app or site CSS has no row here. Lives in the test, not in src/index.ts, because the
 * token source is LOCKED (15 §9); every colour here is an existing token.
 */
export const STATE_PAIRS: {
  rule: string;
  state: string;
  fg: ColorRole;
  bg: ColorRole;
  kind: keyof typeof minContrast;
}[] = [
  // app
  { rule: ':focus-visible', state: 'focus ring on the page', fg: 'focus', bg: 'bg', kind: 'ui' },
  {
    rule: 'h2:focus-visible',
    state: 'focus ring on a screen heading',
    fg: 'focus',
    bg: 'bg',
    kind: 'ui',
  },
  { rule: ':focus-visible', state: 'focus ring on cards', fg: 'focus', bg: 'surface', kind: 'ui' },
  {
    rule: ':focus-visible',
    state: 'focus ring next to a hovered control',
    fg: 'focus',
    bg: 'surfaceRaised',
    kind: 'ui',
  },
  {
    rule: ':focus-visible',
    state: 'focus ring around an input',
    fg: 'focus',
    bg: 'surfaceSunken',
    kind: 'ui',
  },
  {
    rule: '.btn-secondary:hover:not(:disabled)',
    state: 'hover: secondary label',
    fg: 'accent',
    bg: 'surfaceRaised',
    kind: 'text',
  },
  {
    rule: '.btn-quiet:hover:not(:disabled)',
    state: 'hover: quiet label',
    fg: 'text',
    bg: 'surfaceRaised',
    kind: 'text',
  },
  {
    rule: '.btn-danger:hover:not(:disabled)',
    state: 'hover: danger label',
    fg: 'danger',
    bg: 'surfaceRaised',
    kind: 'text',
  },
  {
    rule: '.btn-primary:hover:not(:disabled)',
    state: 'hover: primary label (glow only)',
    fg: 'textOnAccent',
    bg: 'accentDeep',
    kind: 'text',
  },
  {
    rule: '.input-row:hover',
    state: 'hover: input border',
    fg: 'textMuted',
    bg: 'surfaceSunken',
    kind: 'ui',
  },
  {
    rule: '.input-row:focus-within',
    state: 'focus: input ring',
    fg: 'focus',
    bg: 'surface',
    kind: 'ui',
  },
  {
    rule: '.field-error .input-row',
    state: 'error: input border',
    fg: 'danger',
    bg: 'surfaceSunken',
    kind: 'ui',
  },
  {
    rule: '.textarea-row:hover',
    state: 'hover: message box border',
    fg: 'textMuted',
    bg: 'surfaceSunken',
    kind: 'ui',
  },
  {
    rule: '.textarea-row:focus-within',
    state: 'focus: message box ring',
    fg: 'focus',
    bg: 'surface',
    kind: 'ui',
  },
  {
    rule: '.field-error .textarea-row',
    state: 'error: message box border',
    fg: 'danger',
    bg: 'surfaceSunken',
    kind: 'ui',
  },
  {
    rule: '.choice-option:hover',
    state: 'hover: unchosen option',
    fg: 'textMuted',
    bg: 'surfaceRaised',
    kind: 'text',
  },
  {
    rule: '.choice-option:has(input:checked)',
    state: 'checked: option label',
    fg: 'text',
    bg: 'surfaceRaised',
    kind: 'text',
  },
  {
    rule: '.choice-option:has(input:checked)',
    state: 'checked: option border',
    fg: 'accent',
    bg: 'surface',
    kind: 'ui',
  },
  {
    rule: '.choice-option:has(input:focus-visible)',
    state: 'focus: option ring',
    fg: 'focus',
    bg: 'surface',
    kind: 'ui',
  },
  {
    rule: '.disclosure summary:hover',
    state: 'hover: disclosure label',
    fg: 'accent',
    bg: 'surfaceRaised',
    kind: 'text',
  },
  {
    rule: '.deal:hover',
    state: 'hover: saved deal name',
    fg: 'text',
    bg: 'surfaceRaised',
    kind: 'text',
  },
  {
    rule: '.deal:hover',
    state: 'hover: saved deal details',
    fg: 'textMuted',
    bg: 'surfaceRaised',
    kind: 'text',
  },
  {
    rule: '.deal:hover',
    state: 'hover: chips on a hovered deal',
    fg: 'chipText',
    bg: 'chipBg',
    kind: 'text',
  },
  // site
  { rule: '.top nav a:hover', state: 'hover: nav link', fg: 'accent', bg: 'bg', kind: 'text' },
  {
    rule: '.foot nav a:hover',
    state: 'hover: footer link',
    fg: 'accent',
    bg: 'bgBand',
    kind: 'text',
  },
  {
    rule: '.top nav a.pill:hover',
    state: 'hover: nav pill (glow only)',
    fg: 'textOnAccent',
    bg: 'accentDeep',
    kind: 'text',
  },
  {
    rule: '.button-primary:hover',
    state: 'hover: primary call to action (glow only)',
    fg: 'textOnAccent',
    bg: 'accentDeep',
    kind: 'text',
  },
  {
    rule: '.button-secondary:hover',
    state: 'hover: secondary call to action',
    fg: 'text',
    bg: 'surfaceRaised',
    kind: 'text',
  },
];

/** State rules that change no colour (outline: none on an element whose wrapper draws the ring). */
const STATE_RULES_WITHOUT_COLOUR = new Set([
  'h2:focus',
  'main:focus',
  '.input-row input:focus-visible',
  '.textarea-row textarea:focus-visible',
  '.input-row select:focus-visible',
  '.btn:disabled', // disabled controls are exempt from WCAG contrast (1.4.3)
]);

describe('contrast (WCAG AA) in every interactive state', () => {
  for (const p of STATE_PAIRS)
    it(`${p.state}: ${p.fg} on ${p.bg} (${p.kind}; ${p.rule})`, () => {
      const ratio = contrast(color[p.fg], color[p.bg]);
      expect(ratio, `${ratio.toFixed(2)}:1`).toBeGreaterThanOrEqual(minContrast[p.kind]);
    });

  it('every hover / focus / active / checked / error rule in the CSS has a state pair', () => {
    const covered = new Set(STATE_PAIRS.map((p) => p.rule));
    const missing: string[] = [];
    for (const f of [
      join(root, 'apps', 'app', 'src', 'styles.css'),
      join(root, 'apps', 'site', 'src', 'styles', 'site.css'),
    ]) {
      const css = readFileSync(f, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
      for (const m of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
        if (!/\b(color|background|border-color|outline|box-shadow|opacity)\s*:/.test(m[2] ?? ''))
          continue;
        for (const sel of (m[1] ?? '').split(',').map((s) => s.trim().replace(/\s+/g, ' ')))
          if (/:hover|:focus|:active|:checked|field-error|aria-invalid|:disabled/.test(sel))
            if (!covered.has(sel) && !STATE_RULES_WITHOUT_COLOUR.has(sel))
              missing.push(`${relative(root, f)}: ${sel}`);
      }
    }
    expect(missing).toEqual([]);
  });

  // A fade passes through frames where text is below 4.5:1: axe caught the app's target tagline
  // at 2.85:1 mid-fade on CI, and the showcase's section reveals measured 3.98:1 frozen at the
  // start of their fade. So motion is transform-only, in both stylesheets (15 §7). The only
  // exceptions are image-only elements: the hero poster over the canvas, and the product shot.
  const IMAGE_ONLY = new Set(['.poster', ".stage[data-hero='live'] .poster", '.device']);
  for (const [name, file] of [
    ['app', join(root, 'apps', 'app', 'src', 'styles.css')],
    ['site', join(root, 'apps', 'site', 'src', 'styles', 'site.css')],
  ] as const) {
    const rules = cssRules(readFileSync(file, 'utf8'));
    it(`no fade on anything that holds text (${name}): keyframes, transitions and reveals`, () => {
      expect(rules.length).toBeGreaterThan(50);
      const bad = [
        ...rules
          .filter((r) => r.at.some((a) => a.startsWith('@keyframes')))
          .filter((r) => r.decls.some(([p]) => p === 'opacity'))
          .map((r) => `${r.at.join(' ')} ${r.selector}: animates opacity`),
        ...rules
          .filter((r) => !IMAGE_ONLY.has(r.selector))
          .filter((r) =>
            r.decls.some(([p, v]) => p.startsWith('transition') && /\b(opacity|all)\b/.test(v)),
          )
          .map((r) => `${r.selector}: transitions opacity`),
        ...rules
          .filter((r) => r.selector.includes('[data-reveal]'))
          .filter((r) => r.decls.some(([p]) => p === 'opacity'))
          .map((r) => `${r.selector}: a reveal sets opacity`),
      ];
      expect(bad).toEqual([]);
    });
  }
  it('the no-fade check catches a fade', () => {
    const r = cssRules(
      '@keyframes x { from { opacity: 0 } } .a { transition: opacity 1s } [data-reveal]:not(.is-in) { opacity: 0 }',
    );
    expect(r.find((x) => x.at[0] === '@keyframes x')?.decls).toEqual([['opacity', '0']]);
    expect(r.find((x) => x.selector === '.a')?.decls[0]?.[1]).toMatch(/opacity/);
    expect(r.find((x) => x.selector.includes('[data-reveal]'))?.decls).toEqual([['opacity', '0']]);
  });
});

/** A small brace parser, enough for our own stylesheets: every rule with its at-rule nesting. */
const cssRules = (css: string) => {
  const out: { selector: string; at: string[]; decls: [string, string][] }[] = [];
  const stack: string[] = [];
  let buf = '';
  for (const ch of css.replace(/\/\*[\s\S]*?\*\//g, '')) {
    if (ch === '{') {
      stack.push(buf.trim());
      buf = '';
    } else if (ch === '}') {
      const head = stack.pop() ?? '';
      const body = buf.trim();
      buf = '';
      if (!head.startsWith('@') && body !== '')
        out.push({
          selector: head,
          at: [...stack],
          decls: body
            .split(';')
            .map((d) => d.trim())
            .filter(Boolean)
            .map((d) => {
              const i = d.indexOf(':');
              return [d.slice(0, i).trim().toLowerCase(), d.slice(i + 1).trim()];
            }),
        });
    } else buf += ch;
  }
  return out;
};

/** Alpha-composite `fg` at `a` over an opaque `bg`, as a hex colour. */
export const over = (fg: string, a: number, bg: string): string => {
  const ch = (h: string, i: number) => parseInt(h.replace('#', '').slice(i, i + 2), 16);
  return (
    '#' +
    [0, 2, 4]
      .map((i) => Math.round(ch(fg, i) * a + ch(bg, i) * (1 - a)))
      .map((n) => n.toString(16).padStart(2, '0'))
      .join('')
  );
};

describe('text on glass stays readable over the brightest backdrop', () => {
  const worst = over(glass.tint, glass.alpha, glass.worstBackdrop);
  for (const role of onGlass)
    it(`${role} on glass composited over ${glass.worstBackdrop} (${worst})`, () => {
      const ratio = contrast(color[role], worst);
      expect(ratio, `${ratio.toFixed(2)}:1`).toBeGreaterThanOrEqual(minContrast.text);
    });
  it('chips keep their own opaque background on glass', () => {
    expect(contrast(color.chipText, color.chipBg)).toBeGreaterThanOrEqual(minContrast.text);
  });
});

describe('tokens.css', () => {
  it('is exactly what src/index.ts generates (run npm run build:css -w packages/tokens)', () => {
    expect(readFileSync(join(import.meta.dirname, '..', 'src', 'tokens.css'), 'utf8')).toBe(
      toCss(),
    );
  });
});

/**
 * Design lock (15 §9). The doc records the sha256 of src/index.ts (line endings normalised)
 * in the changelog row for the current designVersion. Editing the tokens changes the hash,
 * so the test fails until someone adds a new, dated changelog row (and bumps designVersion).
 */
export const lockOf = (doc: string) =>
  [
    ...doc.matchAll(/^\|\s*v?(\d+\.\d+)\s*\|\s*(\d{4}-\d{2}-\d{2})\s*\|[^\n]*?`([0-9a-f]{64})`/gm),
  ].map((m) => ({ version: m[1] ?? '', date: m[2] ?? '', hash: m[3] ?? '' }));

describe('design lock', () => {
  const src = readFileSync(join(import.meta.dirname, '..', 'src', 'index.ts'), 'utf8');
  const hash = createHash('sha256').update(src.replace(/\r\n/g, '\n')).digest('hex');
  const doc = readFileSync(join(root, 'docs', 'product', '15_design_language.md'), 'utf8');
  const rows = lockOf(doc);

  it(`15_design_language.md is marked LOCKED v${designVersion}`, () => {
    expect(doc).toContain(`LOCKED v${designVersion}`);
  });
  it('the changelog has exactly one row per version, newest last', () => {
    const versions = rows.map((r) => r.version);
    expect(new Set(versions).size).toBe(versions.length);
    expect(versions.at(-1)).toBe(designVersion);
  });
  it(`the token source hash matches the v${designVersion} changelog row`, () => {
    const row = rows.find((r) => r.version === designVersion);
    expect(row, `add a changelog row for v${designVersion} with hash ${hash}`).toBeDefined();
    expect(row?.hash, `token source is now ${hash}: add a new changelog row`).toBe(hash);
  });
  it('the lock parser reads a changelog row', () => {
    const h = 'a'.repeat(64);
    expect(lockOf(`| 1.0 | 2026-11-11 | first | \`${h}\` |`)).toEqual([
      { version: '1.0', date: '2026-11-11', hash: h },
    ]);
    expect(lockOf('| 1.0 | someday | x |')).toEqual([]);
  });
});

/** All CSS-bearing source files of the app and the site. */
const sources = (): string[] => {
  const out: string[] = [];
  const walk = (d: string) => {
    for (const f of readdirSync(d)) {
      const p = join(d, f);
      if (f === 'node_modules' || f === 'dist' || f === '.astro') continue;
      if (statSync(p).isDirectory()) walk(p);
      else if (/\.(css|astro|tsx)$/.test(f)) out.push(p);
    }
  };
  walk(join(root, 'apps', 'app', 'src'));
  walk(join(root, 'apps', 'site', 'src'));
  return out;
};

const RAW_COLOR = /#[0-9a-fA-F]{3,8}\b|\b(rgba?|hsla?|hwb|lab|lch|oklab|oklch)\(/;
const NAMED = /:\s*(?:[^;]*\s)?(white|black|red|blue|green|gray|grey|orange|yellow|purple)\b/i;
const PX_FONT = /font(-size)?\s*:[^;]*\b\d+(\.\d+)?px\b/i;

/** Finds raw colours or px font sizes in CSS declarations and inline style attributes. */
export const violations = (file: string, src: string): string[] => {
  const bad: string[] = [];
  const code = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/<!--[\s\S]*?-->/g, '');
  code.split('\n').forEach((line, i) => {
    const at = `${file}:${i + 1}: ${line.trim()}`;
    // CSS declarations look like "prop: value"; selectors like "#id {" are not values
    const decl = /^\s*[a-z-]+\s*:/.test(line) || /style=|fill=|stroke=|color=/.test(line);
    const tsxRaw =
      file.endsWith('.tsx') && /['"`]#[0-9a-fA-F]{3,8}['"`]|\brgba?\(|\bhsla?\(/.test(line);
    if ((decl && RAW_COLOR.test(line)) || tsxRaw) bad.push(`raw colour: ${at}`);
    if (decl && NAMED.test(line) && !/var\(/.test(line)) bad.push(`named colour: ${at}`);
    if (PX_FONT.test(line)) bad.push(`px font size: ${at}`);
  });
  return bad;
};

describe('no raw colours or px font sizes outside the tokens', () => {
  it('the scanner catches each kind of violation', () => {
    expect(violations('x.css', '.a {\n  color: #fff;\n}')).toHaveLength(1);
    expect(violations('x.css', '.a {\n  background: rgb(0 0 0);\n}')).toHaveLength(1);
    expect(violations('x.css', '.a {\n  font-size: 14px;\n}')).toHaveLength(1);
    expect(violations('x.css', '.a {\n  color: white;\n}')).toHaveLength(1);
    expect(violations('x.astro', '<rect fill="#ff0000" />')).toHaveLength(1);
    expect(violations('x.tsx', "const c = '#A87A22';")).toHaveLength(1);
    expect(violations('x.css', '#more-detail {\n  color: var(--mb-color-text);\n}')).toEqual([]);
    expect(violations('x.css', '.a {\n  font-size: var(--mb-text-md);\n}')).toEqual([]);
  });
  it('apps/app and apps/site use only token variables', () => {
    const bad = sources().flatMap((f) => violations(relative(root, f), readFileSync(f, 'utf8')));
    expect(bad).toEqual([]);
  });
  it('every colour role used as a foreground in CSS has a tested contrast pair', () => {
    const fgRoles = new Set(contrastPairs.map((p) => p.fg));
    const known = new Map(
      (Object.keys(color) as ColorRole[]).map((r) => [`--mb-color-${kebab(r)}`, r]),
    );
    const missing: string[] = [];
    for (const f of sources()) {
      const src = readFileSync(f, 'utf8');
      for (const m of src.matchAll(
        /(?<![-\w])(?:color|fill|stroke)\s*[:=]\s*["']?var\((--mb-color-[a-z-]+)\)/g,
      )) {
        const role = known.get(m[1] ?? '');
        if (!role) missing.push(`${relative(root, f)}: unknown ${m[1]}`);
        else if (!fgRoles.has(role)) missing.push(`${relative(root, f)}: ${role} has no pair`);
      }
    }
    expect(missing).toEqual([]);
  });
});
