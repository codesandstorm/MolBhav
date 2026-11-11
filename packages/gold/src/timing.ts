/**
 * Measured writing and labelling time per message, to re-measure the planning assumptions
 * (1.5 min/message writing, 0.6 min/message per labelling pass;
 * docs/product/04_research_integrity.md §2.1). Hours are only ever re-estimated from these
 * logs, never invented.
 */
export const ASSUMED_MINUTES = { writing: 1.5, labelling: 0.6 } as const;

export const summarise = (seconds: readonly number[]) => {
  if (seconds.length === 0) return null;
  const s = [...seconds].sort((a, b) => a - b);
  const at = (q: number) => s[Math.min(s.length - 1, Math.floor(q * (s.length - 1) + 0.5))]!;
  const total = s.reduce((t, x) => t + x, 0);
  return {
    n: s.length,
    medianMinutes: at(0.5) / 60,
    meanMinutes: total / s.length / 60,
    p90Minutes: at(0.9) / 60,
    totalHours: total / 3600,
  };
};
