import { formatINR, formatShort } from '@molbhav/engine';
import { Labelled } from './Labelled.tsx';

export type RungKind = 'floor' | 'target' | 'opening';

/** Whole per cent of `top`, computed in BigInt (no floats on money); clamped to 0–100. */
export const share = (value: bigint, top: bigint): number => {
  if (top <= 0n || value <= 0n) return 0;
  const p = (value * 100n) / top;
  return Number(p > 100n ? 100n : p);
};

/**
 * One rung of the ladder. Floor is stone (sunken, matte), target is glass with a copper rim,
 * opening glows. The bar repeats the value's size relative to the opening and is decorative.
 */
export function Rung({
  kind,
  title,
  value,
  per,
  top,
}: {
  kind: RungKind;
  title: string;
  value: bigint;
  per: string;
  top: bigint;
}) {
  const short = formatShort(value);
  const [name, ...rest] = title.split(': ');
  return (
    <li className={`rung rung-${kind}`}>
      <span className="rung-name">
        <span className="rung-title">{name}</span>
        {rest.length > 0 && (
          <>
            <span className="sr-only">: </span>
            <span className="rung-tagline">{rest.join(': ')}</span>
          </>
        )}
      </span>
      <Labelled label="CALCULATION" className="rung-value">
        <strong>{formatINR(value) + per}</strong>
        {short && <span className="short"> ({short})</span>}
      </Labelled>
      <span className="rung-bar" aria-hidden="true">
        <span style={{ inlineSize: `${share(value, top)}%` }} />
      </span>
    </li>
  );
}
