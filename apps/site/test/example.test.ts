import { describe, expect, it } from 'vitest';
import { computeLadder } from '@molbhav/engine';
import { exampleForm, toLadderInput } from '../../app/src/form.ts';
import { EXAMPLE, heroLadder } from '../src/lib/example.ts';

describe('showcase example deal', () => {
  it('is the same made-up deal as the app example, so the numbers match', () => {
    const app = computeLadder({ ...toLadderInput(exampleForm), Q: '' });
    const site = computeLadder(EXAMPLE);
    if (!app.ok || !site.ok) throw new Error('invalid example');
    expect([site.floor, site.target, site.opening]).toEqual([app.floor, app.target, app.opening]);
  });
  it('hero data is formatted engine output with BigInt per-mille heights', () => {
    const h = heroLadder();
    expect(h.rungs.map((r) => r.value)).toEqual(['₹38,000', '₹45,600', '₹52,500']);
    // 38,000 × 1000 / 52,500 = 723.8… → 723; 45,600 × 1000 / 52,500 = 868.5… → 868
    expect(h.rungs.map((r) => r.permille)).toEqual([723, 868, 1000]);
    expect(h.roomPct).toBe('13%');
  });
});
