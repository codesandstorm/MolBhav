import { describe, expect, it } from 'vitest';
import { ASSUMED_MINUTES, summarise } from '../src/timing.ts';

describe('timing summary', () => {
  it('median, mean, p90 and total, hand-computed', () => {
    // 60, 90, 120, 180 s: sorted; median index round(0.5·3) = 2 → 120 s = 2 min (upper median)
    // mean = 450/4 = 112.5 s = 1.875 min; p90 index round(0.9·3) = 3 → 180 s = 3 min; total 450 s = 0.125 h
    const s = summarise([120, 60, 180, 90])!;
    expect(s).toEqual({
      n: 4,
      medianMinutes: 2,
      meanMinutes: 1.875,
      p90Minutes: 3,
      totalHours: 0.125,
    });
  });
  it('nothing timed yet → null; the assumptions are 04 §2.1', () => {
    expect(summarise([])).toBeNull();
    expect(ASSUMED_MINUTES).toEqual({ writing: 1.5, labelling: 0.6 });
  });
});
