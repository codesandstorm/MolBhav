import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { LOW_CONFIDENCE, MOVES, OBJECTIONS } from '../src/labels.ts';
import { analyse, RULES_VERSION, type Analysis } from '../src/rules.ts';

/*
 * Fixture rows: made-up tooling examples (most are the ILLUSTRATIVE examples in
 * ml/gold/GUIDELINES.md), marked source "fixture". They are not gold and are never written
 * to ml/gold/ (packages/gold/test/gold-dir.test.ts rejects any fixture row there).
 */
interface Fixture {
  id: string;
  source: 'fixture';
  text: string;
  expect: Partial<Pick<Analysis, 'move' | 'objection' | 'conditional'>>;
}
const fixtures = readFileSync(join(import.meta.dirname, 'fixtures', 'rules.fixture.jsonl'), 'utf8')
  .trim()
  .split('\n')
  .map((l) => JSON.parse(l) as Fixture);

const json = (a: Analysis) =>
  JSON.stringify(a, (_k, v: unknown) => (typeof v === 'bigint' ? `${v}n` : v));

describe('fixture rows', () => {
  it('are all marked source "fixture"', () => {
    expect(fixtures.length).toBeGreaterThan(15);
    for (const f of fixtures) expect(f.source).toBe('fixture');
  });
  it.each(fixtures.map((f) => [f.id, f] as const))('%s', (_id, f) => {
    expect(analyse(f.text)).toMatchObject(f.expect);
  });
});

describe('rule-decided parts', () => {
  it('ANCHOR vs COUNTER comes from deal state, only on PRICE_POSITION (GUIDELINES §5.1)', () => {
    const t = 'Can you do it for 28k?';
    expect(analyse(t, { quoteSent: false }).anchorOrCounter).toBe('ANCHOR');
    expect(analyse(t, { quoteSent: true }).anchorOrCounter).toBe('COUNTER');
    expect(analyse(t, { quoteSent: null }).anchorOrCounter).toBeNull();
    expect(analyse('Sounds good, go ahead.', { quoteSent: true }).anchorOrCounter).toBeNull();
  });
  it('conditional is set only on CONCESSION, from clause cues (GUIDELINES §5.2)', () => {
    const cues = [
      'if',
      'only if',
      'provided',
      'as long as',
      'in exchange',
      'agar',
      'tabhi',
      'toh hi',
    ];
    for (const cue of cues) {
      const a = analyse(`Okay, I can stretch to 38k ${cue} you finish this week.`);
      expect([cue, a.move, a.conditional]).toEqual([cue, 'CONCESSION', true]);
      expect(a.evidence.some((e) => e.supports === 'conditional')).toBe(true);
    }
    expect(analyse('Okay, I can stretch to 38k.').conditional).toBe(false);
    expect(analyse('If you can, send the portfolio?').conditional).toBeNull();
  });
});

describe('invariants', () => {
  const texts = [
    ...fixtures.map((f) => f.text),
    '',
    '   ',
    '????',
    'asdf qwer zxcv',
    '₹45,000 per hour, 18% GST, 3 revisions, by 15th Nov',
    'no no no',
  ];
  const check = (text: string) => {
    const a = analyse(text);
    // no output without evidence
    if (a.move !== null) expect(a.evidence.some((e) => e.supports === a.move)).toBe(true);
    if (a.objection !== null) expect(a.evidence.some((e) => e.supports === a.objection)).toBe(true);
    if (a.conditional === true)
      expect(a.evidence.some((e) => e.supports === 'conditional')).toBe(true);
    if (a.move === null) expect(a.confidence).toBe(0);
    // confidence in [0, 1]
    expect(a.confidence).toBeGreaterThanOrEqual(0);
    expect(a.confidence).toBeLessThanOrEqual(1);
    expect(a.objectionConfidence).toBeGreaterThanOrEqual(0);
    expect(a.objectionConfidence).toBeLessThanOrEqual(1);
    // labels from the fixed vocabulary
    if (a.move !== null) expect(MOVES).toContain(a.move);
    if (a.objection !== null) expect(OBJECTIONS).toContain(a.objection);
    // evidence spans index the text
    for (const e of a.evidence) expect(text.slice(e.start, e.end)).toBe(e.phrase);
    // same input → same output
    expect(json(analyse(text))).toBe(json(a));
    expect(a.source).toBe('rules');
    expect(a.version).toBe(RULES_VERSION);
  };
  it.each(texts.map((t) => [t]))('%j', (t) => check(t));
  it('hold for random text', () => {
    const words = fc.constantFrom(
      'ok',
      'but',
      'if',
      'agar',
      'toh',
      '45k',
      '₹',
      '1.5L',
      'hazaar',
      'tees',
      'too',
      'high',
      'kam',
      'karo',
      'budget',
      'advance',
      'deal',
      'not',
      'nahi',
      '?',
      'send',
      'invoice',
      'portfolio',
      'fiverr',
      'stretch',
      'to',
      '2',
      'pages',
      'Sounds',
      'good',
      'chalo',
      'de',
      'denge',
      'per',
      'hour',
      '%',
      'kitne',
      'din',
      'you',
      'quoted',
    );
    fc.assert(
      fc.property(fc.array(fc.oneof(words, fc.string({ maxLength: 6 })), { maxLength: 25 }), (ws) =>
        check(ws.join(' ')),
      ),
      { seed: 42, numRuns: 300 },
    );
  });
  it('no evidence → no move; the user picks by hand', () => {
    const a = analyse('asdf qwer zxcv');
    expect([a.move, a.objection, a.confidence, a.evidence]).toEqual([null, null, 0, []]);
  });
  it('a tie gives confidence 0, below the low-confidence threshold', () => {
    const a = analyse('Fine, we will pay 40k.');
    expect(a.confidence).toBe(0);
    expect(a.confidence).toBeLessThan(LOW_CONFIDENCE);
  });
  it('the analyser only reads: no floor, target or opening', () => {
    const a = analyse('Can you do it for 28k?') as unknown as Record<string, unknown>;
    for (const k of ['floor', 'target', 'opening']) expect(k in a).toBe(false);
    expect(a.amount).toMatchObject({ rupees: 28000n });
  });
});
