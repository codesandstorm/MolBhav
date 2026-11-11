/**
 * Print the measured writing and labelling times against the planning assumptions.
 *   npm run gold:timing
 */
import { existsSync, readFileSync } from 'node:fs';
import { labelsFile, MESSAGES } from '../src/paths.ts';
import { parseJsonl, type LabelRow, type MessageRow } from '../src/schema.ts';
import { ASSUMED_MINUTES, summarise } from '../src/timing.ts';

const rows = <T>(p: string) => (existsSync(p) ? parseJsonl<T>(readFileSync(p, 'utf8')) : []);
const line = (what: string, assumed: number, s: ReturnType<typeof summarise>) =>
  s
    ? `${what}: n=${s.n}, median ${s.medianMinutes.toFixed(2)} min, mean ${s.meanMinutes.toFixed(2)} min, p90 ${s.p90Minutes.toFixed(2)} min, total ${s.totalHours.toFixed(2)} h (assumed ${assumed} min/message)`
    : `${what}: no timed rows yet (assumed ${assumed} min/message)`;

const writing = rows<MessageRow>(MESSAGES)
  .map((m) => m.meta?.writing_seconds)
  .filter((x): x is number => typeof x === 'number');
console.log(line('Writing', ASSUMED_MINUTES.writing, summarise(writing)));
for (const v of ['v1', 'v2'] as const) {
  const secs = rows<LabelRow>(labelsFile(v))
    .map((l) => l.labelling_seconds)
    .filter((x): x is number => typeof x === 'number');
  console.log(line(`Labelling ${v}`, ASSUMED_MINUTES.labelling, summarise(secs)));
}
