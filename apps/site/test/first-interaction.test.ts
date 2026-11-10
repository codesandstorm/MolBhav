// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { FIRST_INTERACTION_EVENTS, onFirstInteraction } from '../src/lib/first-interaction.ts';

describe('onFirstInteraction', () => {
  it('waits: nothing starts on load or on pointer movement', () => {
    const start = vi.fn();
    const stop = onFirstInteraction(start);
    window.dispatchEvent(new Event('pointermove'));
    window.dispatchEvent(new Event('mousemove'));
    expect(start).not.toHaveBeenCalled();
    stop();
  });
  for (const type of FIRST_INTERACTION_EVENTS)
    it(`starts once on ${type}`, () => {
      const start = vi.fn();
      const stop = onFirstInteraction(start);
      window.dispatchEvent(new Event(type));
      window.dispatchEvent(new Event(type));
      window.dispatchEvent(new Event('keydown'));
      expect(start).toHaveBeenCalledTimes(1);
      stop();
    });
  it('never starts after cleanup, and runs the started cleanup', () => {
    const start = vi.fn();
    onFirstInteraction(start)();
    window.dispatchEvent(new Event('scroll'));
    expect(start).not.toHaveBeenCalled();
    const inner = vi.fn();
    const stop = onFirstInteraction(() => inner);
    window.dispatchEvent(new Event('keydown'));
    stop();
    expect(inner).toHaveBeenCalledTimes(1);
  });
});
