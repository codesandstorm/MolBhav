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
