import { useEffect, useRef } from 'react';
import { formatINR, type LadderOk } from '@molbhav/engine';
import { copy } from '../copy.ts';
import { Labelled } from '../components/Labelled.tsx';
import { Rung, share } from '../components/Rung.tsx';
import { Button, Disclosure, Glass } from '../components/ui.tsx';

const per = (r: LadderOk) => (r.unit === 'hour' ? '/hour' : r.unit === 'month' ? '/month' : '');

/** Decorative track: where the quote sits against the three rungs (all BigInt shares). */
function QuoteTrack({ r, quote }: { r: LadderOk; quote: bigint }) {
  const top = quote > r.opening ? quote : r.opening;
  const at = (v: bigint) => ({ insetInlineStart: `${share(v, top)}%` });
  return (
    <span className="quote-track" aria-hidden="true">
      <span className="tick tick-floor" style={at(r.floor)} />
      <span className="tick tick-target" style={at(r.target)} />
      <span className="tick tick-opening" style={at(r.opening)} />
      <span className="quote-dot" style={at(quote)} />
    </span>
  );
}

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
        {r.opening === r.target ? copy.ladder.noRoom : copy.ladder.room(`${r.concessionRoomPct}%`)}
      </Labelled>
      {q && 'position' in q && (
        <Glass className={`quote quote-${q.position}`}>
          <QuoteTrack r={r} quote={r.floor + q.differenceFromFloor} />
          <Labelled label="CALCULATION" as="p">
            {copy.ladder.quotePositions[q.position]} (
            {q.differenceFromFloor >= 0n
              ? `${formatINR(q.differenceFromFloor)} above it`
              : `${formatINR(-q.differenceFromFloor)} below it`}
            ).
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
    </section>
  );
}
