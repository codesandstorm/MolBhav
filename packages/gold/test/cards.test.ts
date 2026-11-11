import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { MOVES } from '@molbhav/analyser';
import { describeCard, generateCards, PER_CLASS, SEED } from '../src/cards.ts';
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

  it('CONCESSION cards say conditional or not; others do not', () => {
    for (const c of cards) expect(c.conditional === null).toBe(c.intended_move !== 'CONCESSION');
  });

  it('a card is a prompt, not a message', () => {
    const lines = describeCard(cards[0]!);
    expect(lines[0]).toMatch(/^You are the client/);
    expect(lines.join(' ')).toContain('Write a message');
  });
});
