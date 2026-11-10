import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { toCss } from '../src/index.ts';

const out = join(import.meta.dirname, '..', 'src', 'tokens.css');
writeFileSync(out, toCss());
console.log(`wrote ${out}`);
