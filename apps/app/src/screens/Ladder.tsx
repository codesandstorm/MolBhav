import { useEffect, useRef } from 'react';
import { formatINR, formatShort, type LadderOk } from '@molbhav/engine';
import { copy } from '../copy.ts';
import { Labelled } from '../components/Labelled.tsx';

const per = (r: LadderOk) => (r.unit === 'hour' ? '/hour' : r.unit === 'month' ? '/month' : '');

function Rung({ id, title, value, r }: { id: string; title: string; value: bigint; r: LadderOk }) {
  const short = formatShort(value);
  return (
    <li className={`rung rung-${id}`}>
      <span className="rung-title">{title}</span>
      <Labelled label="CALCULATION" className="rung-value">
        <strong>{formatINR(value) + per(r)}</strong>
        {short && <span className="short"> ({short})</span>}
      </Labelled>
    </li>
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
  return (
    <section aria-labelledby="ladder-title">
      <h2 id="ladder-title" tabIndex={-1} ref={h}>
        {copy.ladder.title}
      </h2>
      {isExample && <p className="example-tag">{copy.ladder.example}</p>}
      {r.warnings.includes('unusually_large') && (
        <p className="warning" role="status">
          {copy.ladder.unusuallyLarge}
        </p>
      )}
      {/* Opening at the top, floor at the bottom, like a ladder (08 §8.2). */}
      <ol className="ladder" aria-label={copy.ladder.title}>
        <Rung id="opening" title={copy.ladder.opening} value={r.opening} r={r} />
        <Rung id="target" title={copy.ladder.target} value={r.target} r={r} />
        <Rung id="floor" title={copy.ladder.floor} value={r.floor} r={r} />
      </ol>
      <Labelled label="CALCULATION" as="p" className="room">
        {r.opening === r.target ? copy.ladder.noRoom : copy.ladder.room(`${r.concessionRoomPct}%`)}
      </Labelled>
      {q && 'position' in q && (
        <Labelled label="CALCULATION" as="p" className="quote">
          {copy.ladder.quotePositions[q.position]} (
          {q.differenceFromFloor >= 0n
            ? `${formatINR(q.differenceFromFloor)} above it`
            : `${formatINR(-q.differenceFromFloor)} below it`}
          ).
        </Labelled>
      )}
      <p className="note">{copy.ladder.notMarket}</p>
      <details className="trace">
        <summary>{copy.ladder.how}</summary>
        <ol>
          {r.trace.map((s) => (
            <Labelled key={s.id} label={s.label} as="li">
              {s.expression} = <strong>{s.result}</strong>
            </Labelled>
          ))}
        </ol>
      </details>
      <div className="actions">
        <button type="button" onClick={onEdit}>
          {copy.ladder.edit}
        </button>
        <button type="button" onClick={onEvidence}>
          {copy.ladder.evidence}
        </button>
      </div>
    </section>
  );
}
