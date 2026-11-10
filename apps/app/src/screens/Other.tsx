import { useEffect, useRef, useState } from 'react';
import { copy } from '../copy.ts';
import { Labelled } from '../components/Labelled.tsx';
import { Button, Glass, Toast } from '../components/ui.tsx';
import type { Claim } from '../claims.ts';
import type { StoredDeal } from '../storage.ts';

const useFocus = () => {
  const h = useRef<HTMLHeadingElement>(null);
  useEffect(() => h.current?.focus(), []);
  return h;
};

/** Decorative: the three rungs as they look on the ladder screen (stone, glass, glow). */
function MiniLadder() {
  return (
    <span className="mini-ladder" aria-hidden="true">
      <span className="mini-rung mini-opening" />
      <span className="mini-rung mini-target" />
      <span className="mini-rung mini-floor" />
    </span>
  );
}

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
    <section className="screen welcome" aria-labelledby="welcome-title">
      <div className="welcome-hero">
        <div>
          <p className="eyebrow">{copy.welcome.eyebrow}</p>
          <h2 id="welcome-title" className="display">
            {copy.welcome.headlineLead} <em>{copy.welcome.headlineEmphasis}</em>
          </h2>
          <p className="lede">{copy.welcome.sub}</p>
          <div className="actions">
            <Button variant="primary" onClick={onStart}>
              {copy.welcome.start}
            </Button>
            <Button onClick={onExample}>{copy.welcome.example}</Button>
          </div>
        </div>
        <MiniLadder />
      </div>
      <Glass className="privacy-note">
        <span className="lock" aria-hidden="true" />
        <p>{copy.welcome.privacy}</p>
      </Glass>
      <p className="note" data-rule="">
        {copy.welcome.ageLine}
      </p>
      {deals.length > 0 && (
        <section className="deals-block" aria-labelledby="deals-title">
          <h3 id="deals-title">{copy.deals.title}</h3>
          <ul className="deals">
            {deals.map((d) => (
              <li key={d.id}>
                <button
                  type="button"
                  className="deal glass"
                  data-user-text=""
                  onClick={() => onOpen(d)}
                >
                  <span className="deal-name">{d.form.name.trim() || copy.deals.untitled}</span>
                  <span className="deal-go" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </section>
  );
}

export function Evidence({ claims, onClose }: { claims: Claim[]; onClose: () => void }) {
  const h = useFocus();
  return (
    <section className="screen" aria-labelledby="evidence-title">
      <header className="screen-head">
        <h2 id="evidence-title" tabIndex={-1} ref={h}>
          {copy.evidence.title}
        </h2>
        <p className="lede">{copy.evidence.intro}</p>
      </header>
      <Glass className="evidence-panel">
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
      </Glass>
      <div className="actions">
        <Button onClick={onClose}>{copy.evidence.close}</Button>
      </div>
    </section>
  );
}

export function Settings({ onDeleted }: { onDeleted: () => Promise<void> }) {
  const h = useFocus();
  const [confirming, setConfirming] = useState(false);
  const [done, setDone] = useState(false);
  return (
    <section className="screen" aria-labelledby="settings-title">
      <header className="screen-head">
        <h2 id="settings-title" tabIndex={-1} ref={h}>
          {copy.settings.title}
        </h2>
        <p className="lede">{copy.settings.storage}</p>
      </header>
      <div className="privacy-grid">
        <Glass as="section" aria-labelledby="stays-title">
          <h3 id="stays-title">{copy.settings.staysTitle}</h3>
          <ul className="ticks">
            {copy.settings.stays.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </Glass>
        <Glass as="section" aria-labelledby="never-title">
          <h3 id="never-title">{copy.settings.neverTitle}</h3>
          <ul className="ticks">
            {copy.settings.never.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </Glass>
      </div>
      <Glass as="section" className="danger-zone" aria-labelledby="delete-title">
        <h3 id="delete-title">{copy.settings.deleteTitle}</h3>
        {!confirming ? (
          <Button variant="danger" onClick={() => setConfirming(true)}>
            {copy.settings.delete}
          </Button>
        ) : (
          <div role="alertdialog" aria-labelledby="confirm-text" className="confirm">
            <p id="confirm-text">{copy.settings.confirm}</p>
            <div className="actions">
              <Button
                variant="danger"
                onClick={async () => {
                  await onDeleted();
                  setConfirming(false);
                  setDone(true);
                }}
              >
                {copy.settings.confirmYes}
              </Button>
              <Button onClick={() => setConfirming(false)}>{copy.settings.confirmNo}</Button>
            </div>
          </div>
        )}
      </Glass>
      {done && <Toast>{copy.settings.deleted}</Toast>}
    </section>
  );
}
