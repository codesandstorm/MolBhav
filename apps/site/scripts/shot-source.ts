/**
 * Which app source the showcase's product shot was taken from. The shot is a screenshot of the
 * app's ladder screen; this hash covers the files that draw that screen's layout, so a change
 * to them makes the site's unit test (test/product-shot.test.ts) fail until
 * `npm run shots:product` is run again and the manifest (src/lib/product-shot.json) updated.
 *
 * Not covered [GAP]: shared styles (apps/app/src/styles.css), shared components (ui.tsx) and
 * copy (copy.ts). Hashing those would fail the check on every unrelated screen change.
 */
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export const SHOT_SCREEN = 'ladder';
const app = join(import.meta.dirname, '..', '..', 'app', 'src');
export const SHOT_SOURCES = [
  'screens/Ladder.tsx',
  'components/Rung.tsx',
  'quote-track.ts',
] as const;

/** sha256 over the source files, line endings normalised so Windows and CI agree */
export const shotSourceHash = (): string => {
  const h = createHash('sha256');
  for (const f of SHOT_SOURCES) {
    h.update(`${f}\n`);
    h.update(readFileSync(join(app, f), 'utf8').replace(/\r\n/g, '\n'));
  }
  return h.digest('hex');
};
