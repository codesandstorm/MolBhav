import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { CURRENCIES, MOVES, UNITS } from '@molbhav/analyser';
import { OBJECTION_VALUES, validateJsonl, validateLabel, validateMessage } from '../src/schema.ts';
import { GOLD } from '../src/paths.ts';

const fixtures = readFileSync(
  join(import.meta.dirname, 'fixtures', 'messages.fixture.jsonl'),
  'utf8',
);
const ok = {
  id: 'm0001',
  text: '[FIXTURE, not gold] can you do 30k?',
  source: 'self_authored',
  card_id: 'c001',
  language: 'en',
  labels: null,
};
const label = {
  message_id: 'm0001',
  version: 'v1',
  move: 'PRICE_POSITION',
  objection: 'BUDGET',
  conditional: null,
  amount: {
    rupees: '30000',
    rupees_high: null,
    unit: 'unspecified',
    currency: 'INR',
    ambiguous: false,
  },
  unsure: false,
  labelled_at: '2026-11-11T10:00:00.000Z',
  labelling_seconds: 12.5,
};

describe('gold message schema', () => {
  it('accepts a well-formed self-authored row', () => expect(validateMessage(ok)).toEqual([]));

  it('rejects every fixture row: source must be "self_authored"', () => {
    const errors = validateJsonl('messages', fixtures, 'fixture');
    expect(errors.filter((e) => e.includes('source must be "self_authored"'))).toHaveLength(6);
  });

  it('rejects any other source value, missing fields and unknown fields', () => {
    for (const source of ['fixture', 'real', 'llm', 'public', '', null])
      expect(validateMessage({ ...ok, source }).join()).toContain('source must be');
    const { text: _text, ...noText } = ok;
    void _text;
    expect(validateMessage(noText).join()).toContain('missing field "text"');
    expect(validateMessage({ ...ok, intent: 'PUSHBACK' }).join()).toContain(
      'unknown field "intent"',
    );
    expect(validateMessage({ ...ok, language: 'hi' }).join()).toContain('language');
  });

  it('rejects duplicate ids', () => {
    const line = JSON.stringify(ok);
    expect(validateJsonl('messages', `${line}\n${line}\n`)).toEqual([
      'messages:2: duplicate m0001 (first on line 1)',
    ]);
  });
});

describe('label schema', () => {
  it('accepts a well-formed v1 label', () => expect(validateLabel(label)).toEqual([]));

  it('money is whole rupees as digits: no floats, no words, no lakhs', () => {
    for (const rupees of [30000, '30000.5', '30k', '1.5L', '030000', '-5'])
      expect(validateLabel({ ...label, amount: { ...label.amount, rupees } }).join()).toContain(
        'rupees',
      );
  });

  it('conditional is required for CONCESSION and forbidden otherwise', () => {
    expect(validateLabel({ ...label, move: 'CONCESSION' }).join()).toContain('conditional');
    expect(validateLabel({ ...label, move: 'CONCESSION', conditional: true })).toEqual([]);
    expect(validateLabel({ ...label, conditional: false }).join()).toContain('conditional');
  });

  it('a range must go up; no amount means no unit and no currency', () => {
    expect(
      validateLabel({ ...label, amount: { ...label.amount, rupees_high: '25000' } }).join(),
    ).toContain('above');
    expect(
      validateLabel({
        ...label,
        amount: {
          rupees: null,
          rupees_high: null,
          unit: 'fixed',
          currency: null,
          ambiguous: false,
        },
      }).join(),
    ).toContain('must be null');
  });

  it('the LLM annotator has no labelling time; people do', () => {
    expect(validateLabel({ ...label, version: 'llm', labelling_seconds: null })).toEqual([]);
    expect(validateLabel({ ...label, labelling_seconds: null }).join()).toContain(
      'labelling_seconds',
    );
  });
});

describe('JSON Schema files match the validators', () => {
  const schema = (n: string) =>
    JSON.parse(readFileSync(join(GOLD, 'schema', `${n}.schema.json`), 'utf8')) as {
      required: string[];
      properties: Record<string, { enum?: unknown[]; const?: unknown }>;
      $defs?: { amount: { properties: Record<string, { enum?: unknown[] }> } };
    };
  it('enums and required fields', () => {
    const m = schema('message');
    expect(m.required).toEqual(['id', 'text', 'source', 'card_id', 'language', 'labels']);
    expect(m.properties.source!.const).toBe('self_authored');
    const l = schema('labels');
    expect(l.properties.move!.enum).toEqual([...MOVES]);
    expect(l.properties.objection!.enum).toEqual([...OBJECTION_VALUES]);
    expect(l.$defs!.amount.properties.unit!.enum).toEqual([...UNITS, null]);
    expect(l.$defs!.amount.properties.currency!.enum).toEqual([...CURRENCIES, null]);
    expect(l.required).toEqual(Object.keys(label));
  });
});
