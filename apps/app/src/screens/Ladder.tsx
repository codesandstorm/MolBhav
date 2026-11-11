import { useEffect, useRef } from 'react';
import { formatINR, type LadderOk } from '@molbhav/engine';
import { copy } from '../copy.ts';
import { Labelled } from '../components/Labelled.tsx';
import { Rung } from '../components/Rung.tsx';
import { place, spread } from '../quote-track.ts';
import { Button, Disclosure, Glass } from '../components/ui.tsx';

const per = (r: LadderOk) => (r.unit === 'hour' ? '/hour' : r.unit === 'month' ? '/month' : '');

/**
 * Where the quote sits against the three rungs. The track runs from the lower of floor and
 * quote to the higher of opening and quote, so the rungs use the width instead of crowding
 * at one end. Screen readers get one sentence (role="img"); the sentence below it carries
 * the amounts.
 */
function QuoteTrack({ r, quote, position }: { r: LadderOk; quote: bigint; position: string }) {
  const lo = quote < r.floor ? quote : r.floor;
  const hi = quote > r.opening ? quote : r.opening;
  const x = {
    floor: place(r.floor, lo, hi),
    target: place(r.target, lo, hi),
    opening: place(r.opening, lo, hi),
    quote: place(quote, lo, hi),
  };
  const [lf, lt, lo2] = spread([x.floor, x.target, x.opening]);
  const at = (p: number) => ({ insetInlineStart: `${p}%` });
  const t = copy.ladder.ticks;
  return (
    <div className="quote-track" role="img" aria-label={`${copy.ladder.track}. ${position}.`}>
      <span className="track-line">
        <span className="tick tick-floor" style={at(x.floor)} />
        <span className="tick tick-target" style={at(x.target)} />
        <span className="tick tick-opening" style={at(x.opening)} />
        <span className="quote-dot" style={at(x.quote)} />
      </span>
      <span className="tick-labels">
        <span className="tick-label tick-label-floor" style={at(lf)}>
          {t.floor}
        </span>
        <span className="tick-label tick-label-target" style={at(lt)}>
          {t.target}
        </span>
        <span className="tick-label tick-label-opening" style={at(lo2)}>
          {t.opening}
        </span>
      </span>
    </div>
  );
}

/** The bracket after the quote position, e.g. "₹4,000 above your floor" (BigInt throughout). */
const quoteDiff = (r: LadderOk, quote: bigint, position: string): string => {
  const d = copy.ladder.quoteDiff;
  if (position === 'at_or_above_opening') {
    const over = quote - r.opening;
    return over === 0n ? d.exactly('opening') : d.above(formatINR(over), 'opening');
  }
  const diff = quote - r.floor;
  if (diff < 0n) return d.below(formatINR(-diff));
  return diff === 0n ? d.exactly('floor') : d.above(formatINR(diff), 'floor');
};

export function Ladder({
  result,
  isExample,
  onEdit,
  onEvidence,
}: {
  result: LadderOk;
  isExample: boolean;
  onEdit: () => void;
  onEvidence: () => void;
}) {
  const h = useRef<HTMLHeadingElement>(null);
  useEffect(() => h.current?.focus(), []);
  const r = result;
  const q = r.quote;
  const p = per(r);
  return (
    <section className="screen ladder-screen" aria-labelledby="ladder-title">
      <header className="screen-head">
        <h2 id="ladder-title" tabIndex={-1} ref={h}>
          {copy.ladder.title}
        </h2>
        {isExample && <p className="example-tag">{copy.ladder.example}</p>}
      </header>
      {r.warnings.includes('unusually_large') && (
        <p className="warning" role="status">
          {copy.ladder.unusuallyLarge}
        </p>
      )}
      <div className="ladder-main">
        {/* Opening at the top, floor at the bottom, like a ladder (08 §8.2). */}
        <ol className="ladder" aria-label={copy.ladder.title}>
          <Rung
            kind="opening"
            title={copy.ladder.opening}
            value={r.opening}
            per={p}
            top={r.opening}
          />
          <Rung kind="target" title={copy.ladder.target} value={r.target} per={p} top={r.opening} />
          <Rung kind="floor" title={copy.ladder.floor} value={r.floor} per={p} top={r.opening} />
        </ol>
        <Labelled label="CALCULATION" as="p" className="room">
          {r.opening === r.target
            ? copy.ladder.noRoom
            : copy.ladder.room(`${r.concessionRoomPct}%`)}
        </Labelled>
      </div>
      <div className="ladder-side">
        {q && 'position' in q && (
          <Glass className={`quote quote-${q.position}`}>
            <QuoteTrack
              r={r}
              quote={r.floor + q.differenceFromFloor}
              position={copy.ladder.quotePositions[q.position]}
            />
            <Labelled label="CALCULATION" as="p">
              {copy.ladder.quotePositions[q.position]} (
              {quoteDiff(r, r.floor + q.differenceFromFloor, q.position)}).
            </Labelled>
          </Glass>
        )}
        <p className="note">{copy.ladder.notMarket}</p>
        <Disclosure summary={copy.ladder.how}>
          <ol className="trace">
            {r.trace.map((s) => (
              <Labelled key={s.id} label={s.label} as="li">
                <span className="trace-expr">{s.expression}</span> = <strong>{s.result}</strong>
              </Labelled>
            ))}
          </ol>
        </Disclosure>
        <div className="actions">
          <Button onClick={onEdit}>{copy.ladder.edit}</Button>
          <Button onClick={onEvidence}>{copy.ladder.evidence}</Button>
        </div>
      </div>
    </section>
  );
}
