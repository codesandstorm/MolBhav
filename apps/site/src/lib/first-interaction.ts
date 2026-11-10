/**
 * Runs `start` once, on the visitor's first scroll, wheel, touch, pointer press or key press
 * (decision 1, Phase A2 revision). Pointer *movement* does not count: browsers may synthesise
 * it when layout shifts under a still cursor. Returns a cleanup that removes the listeners
 * and, if `start` already ran, calls the cleanup `start` returned.
 */
export const FIRST_INTERACTION_EVENTS = [
  'scroll',
  'wheel',
  'touchstart',
  'pointerdown',
  'keydown',
] as const;

export const onFirstInteraction = (start: () => void | (() => void)) => {
  let stopStarted: void | (() => void);
  let done = false;
  const opts = { passive: true, capture: true } as const;
  const fire = () => {
    if (done) return;
    done = true;
    remove();
    stopStarted = start();
  };
  const remove = () => {
    for (const e of FIRST_INTERACTION_EVENTS) removeEventListener(e, fire, opts);
  };
  for (const e of FIRST_INTERACTION_EVENTS) addEventListener(e, fire, opts);
  // a reload that restores a scrolled position counts as having scrolled
  if (window.scrollY > 0) fire();
  return () => {
    remove();
    if (stopStarted) stopStarted();
  };
};
