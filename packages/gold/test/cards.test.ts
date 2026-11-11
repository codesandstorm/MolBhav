import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { MOVES } from '@molbhav/analyser';
import {
  contextLine,
  describeCard,
  generateCards,
  labelContext,
  PER_CLASS,
  SCENARIOS,
  SEED,
} from '../src/cards.ts';
import { CARDS_FILE } from '../src/paths.ts';

describe('prompt cards (seed 42)', () => {
  const cards = generateCards(SEED);

  it('same seed, same cards; another seed, other cards', () => {
    expect(generateCards(SEED)).toEqual(cards);
    expect(generateCards(7)).not.toEqual(cards);
  });

  it('the tracked cards file is exactly the generator output (npm run gold:cards)', () => {
    const file = readFileSync(CARDS_FILE, 'utf8')
      .trim()
      .split('\n')
      .map((l) => JSON.parse(l) as unknown);
    expect(file).toEqual(cards);
  });

  it('300 cards, 50 per learned class, so a stratified 20% test holds 10 per class', () => {
    expect(cards).toHaveLength(300);
    for (const m of MOVES) {
      const n = cards.filter((c) => c.intended_move === m).length;
      expect(n).toBe(PER_CLASS);
      expect(Math.round((n * 20) / 100)).toBeGreaterThanOrEqual(10);
    }
    expect(new Set(cards.map((c) => c.card_id)).size).toBe(300);
  });

  it('covers both languages, every amount format and hazaar spelling, and 15% ambiguous', () => {
    expect(new Set(cards.map((c) => c.language))).toEqual(new Set(['en', 'hinglish']));
    expect(new Set(cards.map((c) => c.amount_format))).toEqual(
      new Set(['rupee_comma', 'k', 'hazaar', 'lakh', 'per_hour', 'none']),
    );
    expect(new Set(cards.map((c) => c.hazaar_spelling).filter(Boolean))).toEqual(
      new Set(['hazaar', 'hajar', 'hazar']),
    );
    expect(cards.filter((c) => c.ambiguous)).toHaveLength(45);
  });

  it('amounts are whole rupees, with the written form on the card', () => {
    for (const c of cards) {
      if (c.amount_format === 'none') {
        expect(c.amount_rupees).toBeNull();
        continue;
      }
      expect(c.amount_rupees).toMatch(/^[1-9][0-9]*$/);
      expect(c.amount_text).toBeTruthy();
    }
  });

  it('every card carries its quote as whole rupees and a unit, matching its scenario and text', () => {
    for (const c of cards) {
      const sc = SCENARIOS.find((s) => s.id === c.scenario_id)!;
      expect(c.quote_rupees).toBe(sc.quote.toString());
      expect(c.quote_unit).toBe(
        sc.scale === 'hourly' ? 'hour' : sc.scale === 'monthly' ? 'month' : 'fixed',
      );
      expect(c.quote_text.replace(/[^0-9]/g, '')).toBe(c.quote_rupees);
    }
  });

  it('the context line: the quote when sent, "No quote sent yet" otherwise, nothing else', () => {
    const s01 = cards.find((c) => c.scenario_id === 's01' && c.quote_sent)!;
    expect(contextLine(labelContext(s01))).toBe("Freelancer's quote so far: ₹45,000");
    const s10 = cards.find((c) => c.scenario_id === 's10' && c.quote_sent)!;
    expect(contextLine(labelContext(s10))).toBe("Freelancer's quote so far: ₹2,000 per hour");
    const s08 = cards.find((c) => c.scenario_id === 's08' && c.quote_sent)!;
    expect(contextLine(labelContext(s08))).toBe("Freelancer's quote so far: ₹15,000 per month");
    for (const c of cards.filter((x) => !x.quote_sent)) {
      expect(labelContext(c)).toEqual({ quote_rupees: null, quote_unit: null });
      expect(contextLine(labelContext(c))).toBe('No quote sent yet');
    }
  });

  it('no card contradicts its context: quote references and ACCEPT cards have a quote sent', () => {
    for (const c of cards) {
      if (c.amount_role === 'quote_reference') expect(c.quote_sent).toBe(true);
      if (c.intended_move === 'ACCEPT') expect(c.quote_sent).toBe(true);
    }
  });

  it('CONCESSION cards say conditional or not; others do not', () => {
    for (const c of cards) expect(c.conditional === null).toBe(c.intended_move !== 'CONCESSION');
  });

  it('a card is a prompt, not a message', () => {
    const lines = describeCard(cards[0]!);
    expect(lines[0]).toMatch(/^You are the client/);
    expect(lines.join(' ')).toContain('Write a message');
  });
});
