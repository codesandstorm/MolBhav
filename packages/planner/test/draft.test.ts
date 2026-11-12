/**
 * S6 drafts from templates: the request carries no free text (D3), every template filled from a
 * plan passes its own post-check, and the floor never appears in a client-facing draft (F-2).
 */
import { describe, expect, expectTypeOf, it } from 'vitest';
import fc from 'fast-check';
import { formatINR } from '@molbhav/engine';
import { planReplies } from '../src/plan.ts';
import {
  draftRequest,
  fillTemplate,
  isDraftRequest,
  type DraftRequest,
  type FreeTextKeys,
} from '../src/draft.ts';
import { EDIT_MARK, LANGS, TEMPLATES, TONES } from '../src/templates.ts';
import { CONDITIONS, OPTION_KINDS, type PlanInput, type PlanOption } from '../src/types.ts';
import { EXAMPLE, ladderOf, mk } from './support.ts';

const SENTINEL = 'SENTINEL-client-message-7f3a';
const json = (x: unknown) => JSON.stringify(x, (_, v) => (typeof v === 'bigint' ? `${v}n` : v));

const ctxOf = (input: PlanInput, lang: (typeof LANGS)[number], tone: (typeof TONES)[number]) => ({
  move: input.client.move,
  objection: input.client.objection,
  lang,
  tone,
  unit: input.ladder.unit as 'fixed' | 'hour' | 'month',
});

/** an option can be drafted when every slot its template needs has a value */
const draftable = (o: PlanOption) =>
  !(o.kind === 'SCOPE' && o.figures.scope?.status !== 'ready') &&
  !(o.kind === 'TRADE' && o.condition === null);

describe('D3: the draft request has no free text', () => {
  it('type: DraftRequest has no key that accepts an arbitrary string', () => {
    expectTypeOf<FreeTextKeys<DraftRequest>>().toEqualTypeOf<never>();
    // the check itself works: a type with a string field is caught
    expectTypeOf<FreeTextKeys<{ a: number; message: string }>>().toEqualTypeOf<'message'>();
    expectTypeOf<FreeTextKeys<{ n: { note: string } }>>().toEqualTypeOf<'n'>();
  });

  const base: DraftRequest = {
    kind: 'HOLD',
    move: 'PUSHBACK',
    objection: 'BUDGET',
    lang: 'en',
    tone: 'polite',
    condition: null,
    unit: 'fixed',
    numbers: { your_price: 52500n },
  };

  it('runtime: the validator accepts a request and rejects extra keys, strings and bad numbers', () => {
    expect(isDraftRequest(base)).toBe(true);
    const bad: unknown[] = [
      { ...base, message: SENTINEL },
      { ...base, clientText: '' },
      { ...base, kind: SENTINEL },
      { ...base, move: 'pushback' },
      { ...base, lang: 'hi' },
      { ...base, condition: SENTINEL },
      { ...base, unit: 'day' },
      { ...base, numbers: { your_price: '52500' } },
      { ...base, numbers: { your_price: 52500 } },
      { ...base, numbers: { your_price: 0n } },
      { ...base, numbers: { your_price: -1n } },
      { ...base, numbers: { floor: 38000n } },
      { ...base, numbers: { note: SENTINEL } },
      { ...base, numbers: [52500n] },
      [],
      null,
      SENTINEL,
    ];
    for (const b of bad) expect(isDraftRequest(b)).toBe(false);
    expect(fillTemplate({ ...base, message: SENTINEL } as unknown as DraftRequest)).toEqual({
      ok: false,
      error: 'invalid_request',
    });
  });

  it('a request built from a plan holds only known keys, and no client text', () => {
    const input = mk({ amount: 47000n, objection: 'BUDGET', condition: 'ADVANCE' });
    // the client's own words live with the reader, never in PlanInput; even if a caller attaches
    // them, draftRequest copies only enumerated fields and numbers
    const withText = { ...input, client: { ...input.client, text: SENTINEL } } as PlanInput;
    for (const o of planReplies(withText).options) {
      const r = draftRequest(
        { ...o, text: SENTINEL } as PlanOption,
        ctxOf(input, 'en', 'polite'),
        50n,
      );
      expect(isDraftRequest(r)).toBe(true);
      expect(json(r)).not.toContain(SENTINEL);
      expect(Object.keys(r).sort()).toEqual(
        ['condition', 'kind', 'lang', 'move', 'numbers', 'objection', 'tone', 'unit'].sort(),
      );
    }
  });
});

describe('templates', () => {
  it('there is one template per kind, language and tone, with unique ids', () => {
    expect(TEMPLATES).toHaveLength(OPTION_KINDS.length * LANGS.length * TONES.length);
    expect(new Set(TEMPLATES.map((t) => t.id)).size).toBe(TEMPLATES.length);
  });

  it('no template has a digit, a currency sign, or a floor slot of its own', () => {
    for (const t of TEMPLATES) {
      expect(t.text).not.toMatch(/[0-9₹%]/);
      expect(t.text).not.toMatch(/\{floor/);
      expect(t.text).not.toMatch(/[^\x20-\x7E]/); // Roman script only
    }
  });

  it('every template, filled for the example deal, passes its own check (every condition)', () => {
    const input = mk({ amount: 47000n, objection: 'BUDGET', reducedEffort: '5' });
    const p = planReplies(input);
    const numbers = {
      your_price: 52500n,
      counter_price: 50800n,
      client_price: 47000n,
      scope_price: 40000n,
      agreed_price: 52500n,
      advance_pct: 50n,
    };
    let filled = 0;
    for (const t of TEMPLATES)
      for (const condition of t.kind === 'TRADE' ? CONDITIONS : [null]) {
        const d = fillTemplate({
          kind: t.kind,
          move: 'PUSHBACK',
          objection: 'BUDGET',
          lang: t.lang,
          tone: t.tone,
          condition,
          unit: 'fixed',
          numbers,
        });
        expect(d.ok, `${t.id} ${condition}`).toBe(true);
        if (d.ok) {
          expect(d.templateId).toBe(t.id);
          expect(d.text).not.toMatch(/\{[a-z_]+\}/);
          expect(d.needsEdit).toBe(d.text.includes(EDIT_MARK));
          filled++;
        }
      }
    expect(filled).toBeGreaterThanOrEqual(TEMPLATES.length);
    expect(p.options.length).toBeGreaterThanOrEqual(2);
  });

  it('a trade with an advance share drafts that share, and no other percent', () => {
    const input = mk({
      amount: 47000n,
      objection: 'BUDGET',
      condition: 'ADVANCE',
      advancePct: 25n,
    });
    const trade = planReplies(input).options.find((o) => o.kind === 'TRADE')!;
    const d = fillTemplate(draftRequest(trade, ctxOf(input, 'en', 'firm'), 25n));
    expect(d.ok).toBe(true);
    if (d.ok) {
      expect(d.text).toContain('25%');
      expect(d.allowed.percents).toEqual([25n]);
    }
    // a share outside the fixed list is never copied
    const r = draftRequest(trade, ctxOf(input, 'en', 'firm'), 30n);
    expect(r.numbers.advance_pct).toBeUndefined();
    expect(fillTemplate(r)).toMatchObject({ ok: false, error: 'missing_number' });
  });

  it('fails closed: a missing slot or a number not allowed gives no draft', () => {
    expect(
      fillTemplate({
        kind: 'TRADE',
        move: null,
        objection: null,
        lang: 'en',
        tone: 'polite',
        condition: 'MILESTONES',
        unit: 'fixed',
        numbers: { your_price: 52500n },
      }),
    ).toMatchObject({ ok: false, error: 'missing_number' });
    expect(
      fillTemplate({
        kind: 'TRADE',
        move: null,
        objection: null,
        lang: 'en',
        tone: 'polite',
        condition: null,
        unit: 'fixed',
        numbers: { your_price: 52500n, counter_price: 50800n },
      }),
    ).toMatchObject({ ok: false, error: 'missing_number' });
  });
});

describe('drafts from random plans (2,500 runs)', () => {
  const ladders = [
    ladderOf(),
    ladderOf({ ...EXAMPLE, u: 'month', e: '18' }),
    ladderOf({ u: 'hour', eu: 'hour', e: '40', K: '144', M: '90000', C: '3000', t: '20', a: '15' }),
  ];
  const inputArb = fc
    .record({
      amount: fc.oneof(fc.constant(null), fc.bigInt({ min: 100n, max: 90000n })),
      quote: fc.oneof(fc.constant(null), fc.bigInt({ min: 300n, max: 70000n })),
      move: fc.constantFrom(
        'PRICE_POSITION',
        'PUSHBACK',
        'CONCESSION',
        'INFO_REQUEST',
        'ACCEPT',
        'OTHER',
        null,
      ),
      objection: fc.constantFrom(
        'BUDGET',
        'SCOPE',
        'TIMELINE',
        'PAYMENT_TERMS',
        'TRUST',
        'COMPETITOR',
        null,
      ),
      condition: fc.constantFrom(null, ...CONDITIONS),
      advancePct: fc.constantFrom(25n, 50n),
      reducedEffort: fc.constantFrom(null, '1', '3', '5', '6'),
      source: fc.constantFrom('manual', 'analyser'),
      confidence: fc.oneof(fc.constant(null), fc.double({ min: 0, max: 1, noNaN: true })),
      li: fc.integer({ min: 0, max: 2 }),
      lang: fc.constantFrom(...LANGS),
      tone: fc.constantFrom(...TONES),
    })
    .map((x) => ({
      ...x,
      input: mk({
        ladder: ladders[x.li],
        amount: x.amount,
        quote: x.quote,
        move: x.move as never,
        objection: x.objection as never,
        condition: x.condition,
        advancePct: x.advancePct,
        reducedEffort: x.reducedEffort,
        source: x.source as 'manual' | 'analyser',
        confidence: x.confidence,
      }),
    }));

  it('every draftable option fills and passes its own check; the floor is never in a draft', () => {
    fc.assert(
      fc.property(inputArb, ({ input, lang, tone, advancePct }) => {
        const p = planReplies(input);
        const floor = formatINR(input.ladder.floor);
        for (const o of p.options) {
          if (!draftable(o)) continue;
          const d = fillTemplate(draftRequest(o, ctxOf(input, lang, tone), advancePct));
          expect(d.ok, `${o.kind} ${lang} ${tone}`).toBe(true);
          if (!d.ok) continue;
          expect(d.check.ok).toBe(true);
          const theirsOrSent =
            input.ladder.floor === p.clientPrice || input.ladder.floor === input.deal.currentQuote;
          if (!theirsOrSent && o.kind !== 'SCOPE') expect(d.text).not.toContain(floor);
          if (o.kind === 'SCOPE') {
            const sf = o.figures.scope;
            if (sf?.status === 'ready' && sf.figures.floor !== p.clientPrice)
              expect(d.text).not.toContain(formatINR(sf.figures.floor));
          }
        }
      }),
      { numRuns: 2500 },
    );
  });
});
