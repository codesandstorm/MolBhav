/**
 * LLM second annotator (skeleton). DO NOT RUN: no provider is chosen, and it fails closed.
 *   MOLBHAV_LLM_PROVIDER=… MOLBHAV_LLM_MODEL=… MOLBHAV_LLM_API_KEY=… npm run gold:annotate
 * Reads only ml/gold/GUIDELINES.md and the id + text of ml/gold/data/messages.jsonl.
 * Writes ml/gold/data/labels_llm.jsonl and ml/gold/data/llm_run.json (prompt, hashes, model).
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  AnnotatorError,
  buildPrompt,
  configFromEnv,
  redact,
  runRecord,
  TEMPERATURE,
} from '../src/annotator.ts';
import { DATA, GUIDELINES, labelsFile, MESSAGES } from '../src/paths.ts';
import { parseJsonl, validateLabel, type LabelRow } from '../src/schema.ts';

const key = process.env.MOLBHAV_LLM_API_KEY;
const say = (s: string) => console.error(redact(s, key));

try {
  const config = configFromEnv(); // fails closed before anything is read or sent
  if (!existsSync(MESSAGES)) throw new AnnotatorError(`missing ${MESSAGES}`);
  if (existsSync(labelsFile('llm')))
    throw new AnnotatorError('labels_llm.jsonl exists: one run only');
  const guidelines = readFileSync(GUIDELINES, 'utf8');
  const messages = parseJsonl<{ id: string; text: string }>(readFileSync(MESSAGES, 'utf8')).map(
    ({ id, text }) => ({ id, text }),
  );
  const rows: LabelRow[] = [];
  let version = config.model;
  for (const m of messages) {
    const p = buildPrompt(guidelines, m.text);
    const out = await config.adapter.annotate(
      { system: p.system, user: p.user, model: config.model, temperature: TEMPERATURE },
      config.key,
    );
    version = out.modelVersion;
    const parsed = JSON.parse(out.text) as Omit<
      LabelRow,
      'message_id' | 'version' | 'labelled_at' | 'labelling_seconds'
    >;
    const row: LabelRow = {
      message_id: m.id,
      version: 'llm',
      ...parsed,
      labelled_at: new Date().toISOString(),
      labelling_seconds: null,
    };
    const errors = validateLabel(row, m.id);
    if (errors.length)
      throw new AnnotatorError(`invalid label from the model: ${errors.join('; ')}`);
    rows.push(row);
  }
  writeFileSync(labelsFile('llm'), rows.map((r) => JSON.stringify(r)).join('\n') + '\n');
  writeFileSync(
    join(DATA, 'llm_run.json'),
    JSON.stringify(runRecord(config, buildPrompt(guidelines, ''), version), null, 2) + '\n',
  );
  console.log(`${rows.length} LLM labels written.`);
} catch (e) {
  say(`annotate: ${e instanceof Error ? e.message : String(e)}`);
  process.exit(1);
}
