import { describe, expect, it } from 'vitest';
import { computeLadder, type LadderInput } from '../src/index.ts';

// Spec 13 §5.2: one error code, the first failing check in a fixed order.
// Each test breaks two checks and expects the earlier one.
const base: LadderInput = {
  u: 'fixed',
  eu: 'day',
  e: 7,
  K: 18,
  M: 90000,
  C: 3000,
  b: 0,
  t: 20,
  a: 15,
};
const err = (i: LadderInput) => {
  const r = computeLadder(i);
  return r.ok ? 'OK' : r.error;
};

describe('validation order (spec §5.2)', () => {
  it('base input is valid', () => expect(err(base)).toBe('OK'));
  it('1 before 2: u_invalid before eu_invalid', () =>
    expect(err({ ...base, u: 'yearly', eu: 'week' })).toBe('u_invalid'));
  it('2 before 3: eu_invalid before e_missing', () =>
    expect(err({ ...base, eu: 'week', e: null })).toBe('eu_invalid'));
  it('2: eu must be hour when u is hour', () =>
    expect(err({ ...base, u: 'hour', eu: 'day' })).toBe('eu_invalid'));
  it('3 before 5: e_missing before K_out_of_range', () =>
    expect(err({ ...base, e: null, K: 0 })).toBe('e_missing'));
  it('4 before 5: e_out_of_range before K_out_of_range', () =>
    expect(err({ ...base, e: 0, K: 40 })).toBe('e_out_of_range'));
  it('5 before 6: K_out_of_range before M_out_of_range', () =>
    expect(err({ ...base, K: 32, M: 0 })).toBe('K_out_of_range'));
  it('6 before 7: M before C', () => expect(err({ ...base, M: 0, C: -1 })).toBe('M_out_of_range'));
  it('6: inside a field, the type check comes first (not_whole_rupees before M_out_of_range)', () =>
    expect(err({ ...base, M: -0.5 })).toBe('not_whole_rupees'));
  it('7 before 8: C before b', () =>
    expect(err({ ...base, C: -1, b: 101 })).toBe('C_out_of_range'));
  it('8 before 9: b before t', () =>
    expect(err({ ...base, b: 101, t: 301 })).toBe('b_out_of_range'));
  it('9: t before a', () => expect(err({ ...base, t: 301, a: 301 })).toBe('t_out_of_range'));
  it('single-field checks before cross-field (a_out_of_range before e_exceeds_K)', () =>
    expect(err({ ...base, u: 'month', e: 25, K: 20, a: 301 })).toBe('a_out_of_range'));
  it('10: e_exceeds_K for month', () =>
    expect(err({ ...base, u: 'month', e: 25, K: 20 })).toBe('e_exceeds_K'));
  it('11: hour_costs_need_e', () =>
    expect(err({ ...base, u: 'hour', eu: 'hour', e: null, K: 140, C: 500 })).toBe(
      'hour_costs_need_e',
    ));
  it('missing M is M_out_of_range', () => {
    const { M: _drop, ...rest } = base;
    void _drop;
    expect(err(rest as LadderInput)).toBe('M_out_of_range');
  });
  it('"e": null and an absent e both mean missing (§5.1)', () => {
    const { e: _drop, ...rest } = base;
    void _drop;
    expect(err(rest as LadderInput)).toBe('e_missing');
    expect(err({ ...base, e: null })).toBe('e_missing');
    expect(err({ ...base, e: '' })).toBe('e_missing');
  });
  it('an invalid quote never blocks the ladder (§5.3)', () => {
    const r = computeLadder({ ...base, Q: 0 });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.quote).toEqual({ error: 'Q_out_of_range' });
    const r2 = computeLadder({ ...base, Q: 100.5 });
    if (r2.ok) expect(r2.quote).toEqual({ error: 'not_whole_rupees' });
  });
});
