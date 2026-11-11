import { describe, expect, it } from 'vitest';
import { MOVES } from '@molbhav/analyser';
import { reportStub, sha256, stratifiedSplit, toJsonl } from '../src/split.ts';
import type { LabelRow, MessageRow } from '../src/schema.ts';

/** 100 clearly fake rows (source "fixture"): never gold, never written to ml/gold/. */
const rows = Array.from({ length: 100 }, (_, i) => ({
  id: `m${String(i + 1).padStart(4, '0')}`,
  text: `[FIXTURE, not gold] row ${i + 1}`,
  source: 'fixture',
  card_id: `c${String(i + 1).padStart(3, '0')}`,
  language: i % 2 ? 'en' : 'hinglish',
  labels: null,
})) as unknown as MessageRow[];
const labels: LabelRow[] = rows.map((m, i) => ({
  message_id: m.id,
  version: 'v1',
  context: { quote_rupees: null, quote_unit: null },
  move: MOVES[i % 5]!, // 5 classes × 20 rows; OTHER has none
  objection: 'NONE',
  conditional: MOVES[i % 5] === 'CONCESSION' ? false : null,
  amount: { rupees: null, rupees_high: null, unit: null, currency: null, ambiguous: false },
  unsure: false,
  labelled_at: '2026-11-11T10:00:00.000Z',
  labelling_seconds: 1,
}));

describe('stratified split and freeze', () => {
  const s = stratifiedSplit(rows, labels);

  it('60/20/20 within every class', () => {
    for (const m of MOVES.slice(0, 5))
      expect([s.counts.train[m], s.counts.dev[m], s.counts.test[m]]).toEqual([12, 4, 4]);
    expect(s.counts.test.OTHER).toBe(0);
    expect(s.train.length + s.dev.length + s.test.length).toBe(100);
  });

  it('no message is in two splits', () => {
    const ids = [...s.train, ...s.dev, ...s.test].map((m) => m.id);
    expect(new Set(ids).size).toBe(100);
  });

  it('deterministic: the same seed gives the same test file and hash, in any input order', () => {
    const again = stratifiedSplit([...rows].reverse(), labels);
    expect(toJsonl(again.test)).toBe(toJsonl(s.test));
    expect(sha256(toJsonl(stratifiedSplit(rows, labels, 7).test))).not.toBe(
      sha256(toJsonl(s.test)),
    );
  });

  it('refuses to split before label pass 1 is finished', () => {
    expect(() => stratifiedSplit(rows, labels.slice(1))).toThrow(/not finished/);
  });

  it('sha256 is the standard digest', () =>
    // sha256("abc"), the FIPS 180-2 test vector
    expect(sha256('abc')).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad'));

  it('the eval report carries the AI-assistance disclosure and the objection rule, verbatim', () => {
    const r = reportStub({
      test_sha256: 'x',
      frozen_at: '2026-11-11T00:00:00.000Z',
      seed: 42,
      guidelines_version: 'v0.2',
      messages: 100,
      counts: s.counts,
    });
    expect(r).toContain(
      'The prompt cards, the guideline examples and the rule baseline were drafted with AI assistance; the gold messages themselves are written and labelled by the author.',
    );
    expect(r).toContain('Objection types are scored for the rules only, labelled ESTIMATE');
  });
});
