import { afterEach, expect, it } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { computeLadder } from '@molbhav/engine';
import { Ladder } from '../src/screens/Ladder.tsx';
import { copy } from '../src/copy.ts';

afterEach(cleanup);

it('says "no room at this price" instead of 0% when opening = target (spec 13 v0.3 §3.5)', () => {
  // exact floor ₹11/hour → rungs 20 / 20 / 20
  const r = computeLadder({ u: 'hour', eu: 'hour', K: 100, M: 1100 });
  if (!r.ok) throw new Error(r.error);
  const { container } = render(
    <Ladder result={r} isExample={false} onEdit={() => {}} onEvidence={() => {}} />,
  );
  const room = container.querySelector('.room');
  expect(room?.textContent).toContain(copy.ladder.noRoom);
  expect(room?.textContent).not.toContain('0%');
});
