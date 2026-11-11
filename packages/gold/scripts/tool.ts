/**
 * Start a local gold-set tool on 127.0.0.1 (never on the network).
 *   npm run gold:write              writing tool    → http://127.0.0.1:4410/
 *   npm run gold:label              blind labelling, pass v1 → http://127.0.0.1:4411/
 *   npm run gold:label -- --pass v2 test-retest pass (≥ 14 days after v1)
 * Stop it with Ctrl+C. Data: ml/gold/data/ (gitignored until the owner decides to commit it).
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Card } from '../src/cards.ts';
import { generateCards, SEED } from '../src/cards.ts';
import { CARDS_FILE, DATA, ROOT } from '../src/paths.ts';
import { parseJsonl } from '../src/schema.ts';
import { createToolServer } from '../src/tool-server.ts';

const args = process.argv.slice(2);
const mode = args[0] === 'label' ? 'label' : args[0] === 'write' ? 'write' : null;
if (!mode) {
  console.error('usage: tool.ts write | label [--pass v1|v2] [--port N]');
  process.exit(1);
}
const flag = (name: string) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
};
const pass = flag('pass') === 'v2' ? 'v2' : 'v1';
const port = Number(flag('port') ?? (mode === 'write' ? 4410 : 4411));

const cards = parseJsonl<Card>(readFileSync(CARDS_FILE, 'utf8'));
if (JSON.stringify(cards) !== JSON.stringify(generateCards(SEED))) {
  console.error(
    'ml/gold/cards/cards.jsonl differs from the seed-42 generator: run npm run gold:cards',
  );
  process.exit(1);
}

const server = createToolServer({
  mode,
  pass,
  dataDir: DATA,
  cards,
  staticDir: join(import.meta.dirname, '..', 'tools'),
  tokensCss: join(ROOT, 'packages', 'tokens', 'src', 'tokens.css'),
});
server.listen(port, '127.0.0.1', () => {
  const what = mode === 'write' ? 'Writing tool' : `Blind labelling, pass ${pass}`;
  console.log(`${what}: open http://127.0.0.1:${port}/ in your browser. Ctrl+C to stop.`);
  console.log(`Saving to ${DATA}`);
});
