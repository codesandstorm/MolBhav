import { useEffect, useRef, useState } from 'react';
import { copy } from '../copy.ts';
import { Labelled } from '../components/Labelled.tsx';
import type { Claim } from '../claims.ts';
import type { StoredDeal } from '../storage.ts';

const useFocus = () => {
  const h = useRef<HTMLHeadingElement>(null);
  useEffect(() => h.current?.focus(), []);
  return h;
};

export function Welcome({
  deals,
  onExample,
  onStart,
  onOpen,
}: {
  deals: StoredDeal[];
  onExample: () => void;
  onStart: () => void;
  onOpen: (d: StoredDeal) => void;
}) {
  return (
    <section aria-labelledby="welcome-title">
      <h2 id="welcome-title">{copy.welcome.headline}</h2>
      <p>{copy.welcome.sub}</p>
      <div className="actions">
        <button type="button" className="primary" onClick={onStart}>
          {copy.welcome.start}
        </button>
        <button type="button" onClick={onExample}>
          {copy.welcome.example}
        </button>
      </div>
      <p className="note">{copy.welcome.privacy}</p>
      <p className="note" data-rule="">
        {copy.welcome.ageLine}
      </p>
      {deals.length > 0 && (
        <>
          <h3>{copy.deals.title}</h3>
          <ul className="deals">
            {deals.map((d) => (
              <li key={d.id}>
                <button type="button" className="link" data-user-text="" onClick={() => onOpen(d)}>
                  {d.form.name.trim() || copy.deals.untitled}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}

export function Evidence({ claims, onClose }: { claims: Claim[]; onClose: () => void }) {
  const h = useFocus();
  return (
    <section aria-labelledby="evidence-title">
      <h2 id="evidence-title" tabIndex={-1} ref={h}>
        {copy.evidence.title}
      </h2>
      <p>{copy.evidence.intro}</p>
      <table className="evidence">
        <thead>
          <tr>
            <th scope="col">What</th>
            <th scope="col">Value</th>
            <th scope="col">Source</th>
          </tr>
        </thead>
        <tbody>
          {claims.map((c) => (
            <tr key={c.id}>
              <th scope="row">{c.what}</th>
              <td>
                <Labelled label={c.label}>{c.value}</Labelled>
              </td>
              <td data-source="">{c.source}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <button type="button" onClick={onClose}>
        {copy.evidence.close}
      </button>
    </section>
  );
}

export function Settings({ onDeleted }: { onDeleted: () => Promise<void> }) {
  const h = useFocus();
  const [confirming, setConfirming] = useState(false);
  const [done, setDone] = useState(false);
  return (
    <section aria-labelledby="settings-title">
      <h2 id="settings-title" tabIndex={-1} ref={h}>
        {copy.settings.title}
      </h2>
      <p>{copy.settings.storage}</p>
      {!confirming ? (
        <button type="button" className="danger" onClick={() => setConfirming(true)}>
          {copy.settings.delete}
        </button>
      ) : (
        <div role="alertdialog" aria-labelledby="confirm-text" className="confirm">
          <p id="confirm-text">{copy.settings.confirm}</p>
          <button
            type="button"
            className="danger"
            onClick={async () => {
              await onDeleted();
              setConfirming(false);
              setDone(true);
            }}
          >
            {copy.settings.confirmYes}
          </button>
          <button type="button" onClick={() => setConfirming(false)}>
            {copy.settings.confirmNo}
          </button>
        </div>
      )}
      {done && <p role="status">{copy.settings.deleted}</p>}
    </section>
  );
}
