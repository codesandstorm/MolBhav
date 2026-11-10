/**
 * The one React island on the page. It renders nothing itself: it decides whether the live
 * 3D ladder may load, and downloads it (three and R3F live in that chunk) only after the
 * visitor's first scroll, touch, pointer or key event. Until then the poster in the HTML is
 * the picture. Astro hydrates this island with client:media="(prefers-reduced-motion:
 * no-preference)", so visitors who ask for reduced motion never download any of it. The
 * poster comes back whenever the scene fails (no WebGL, context lost, sustained low fps).
 */
import { useCallback, useEffect, useState, type ComponentType } from 'react';
import type { LiveProps } from './LadderScene.tsx';
import { canUseWebGL, wantsSaveData } from '../lib/fps-guard.ts';
import { onFirstInteraction } from '../lib/first-interaction.ts';

const mark = (state: 'poster' | 'loading' | 'live') =>
  document.querySelector('[data-stage]')?.setAttribute('data-hero', state);

export default function HeroScene({ permille }: { permille: LiveProps['permille'] }) {
  const [Live, setLive] = useState<ComponentType<LiveProps> | null>(null);

  useEffect(() => {
    if (!canUseWebGL() || wantsSaveData()) return mark('poster');
    let cancelled = false;
    return onFirstInteraction(() => {
      mark('loading');
      import('./LadderScene.tsx')
        .then((m) => !cancelled && setLive(() => m.default))
        .catch(() => mark('poster'));
      return () => {
        cancelled = true;
      };
    });
  }, []);

  const onReady = useCallback(() => mark('live'), []);
  const onFail = useCallback(() => {
    mark('poster');
    setLive(null);
  }, []);

  return Live ? <Live permille={permille} onReady={onReady} onFail={onFail} /> : null;
}
