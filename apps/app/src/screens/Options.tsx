import { useEffect, useRef } from 'react';
import { formatINR, type LadderOk } from '@molbhav/engine';
import type { Move } from '@molbhav/analyser';
import {
  CONDITION_COPY,
  NOTE_COPY,
  OPTION_COPY,
  REASONS,
  type Plan,
  type PlanOption,
} from '@molbhav/planner';
import { copy } from '../copy.ts';
import { Labelled, type ClaimLabel } from '../components/Labelled.tsx';
import { Button, Field, Glass } from '../components/ui.tsx';
import type { ReplyPrefs } from '../reply.ts';

/**
 * S5 "Your options" (Phase C1). The planner (packages/planner, docs/product/18_planner_rules.md)
 * turns the ladder and the reader's results into 2 to 4 ranked options. Every figure is a
 * CALCULATION from the engine; every reason is a RECOMMENDATION; the user's picks are USER
 * DECISIONs; the reader's results stay ESTIMATEs. The floor is shown here, to the user only, and
 * is never a draft slot. The user chooses; nothing is sent anywhere.
 */
const t = copy.options;

export const perUnit = (r: LadderOk) =>
  r.unit === 'hour' ? '/hour' : r.unit === 'month' ? '/month' : '';

/** what the reader read, as the options screen shows it */
export interface TheirSide {
  move: Move | null;
  moveLabel: ClaimLabel;
  amount: bigint | null;
  amountLabel: ClaimLabel;
}

export const draftable = (o: PlanOption) =>
  !(o.kind === 'SCOPE' && o.figures.scope?.status !== 'ready');

function Figure({
  name,
  value,
  per,
  label = 'CALCULATION',
  extra,
}: {
  name: string;
  value: bigint;
  per: string;
  label?: ClaimLabel;
  extra?: string;
}) {
  return (
    <div className="option-figure">
      <dt>{name}</dt>
      <dd>
        <Labelled label={label}>
          <strong>
            {formatINR(value)}
            {per}
          </strong>
          {extra ? <span className="option-extra"> · {extra}</span> : null}
        </Labelled>
      </dd>
    </div>
  );
}

function OptionCard({
  o,
  plan,
  ladder,
  prefs,
  setPrefs,
  first,
  clientLabel,
  onDraft,
}: {
  o: PlanOption;
  /** the client's number is theirs: ESTIMATE as read, USER DECISION once the user typed it */
  clientLabel: ClaimLabel;
  plan: Plan;
  ladder: LadderOk;
  prefs: ReplyPrefs;
  setPrefs: (p: Partial<ReplyPrefs>) => void;
  first: boolean;
  onDraft: () => void;
}) {
  const c = OPTION_COPY[o.kind];
  const per = perUnit(ladder);
  const f = o.figures;
  const sc = f.scope;
  const titleId = `option-${o.kind}`;
  const hours = ladder.inputs.eu === 'hour';
  return (
    <Glass as="li" className="option-card" aria-labelledby={titleId}>
      <div className="option-head" data-option={o.kind}>
        <h3 id={titleId}>{c.name}</h3>
        {first && <span className="option-rank">{t.recommended}</span>}
      </div>
      <p className="option-meaning">{c.meaning}</p>
      <dl className="option-figures">
        {o.kind === 'TRADE' || o.kind === 'STEP' ? (
          <>
            <Figure
              name={t.counter}
              value={f.counter!}
              per={per}
              {...(f.stepDown !== null ? { extra: t.stepDown(formatINR(f.stepDown)) } : {})}
            />
            {o.kind === 'TRADE' && <Figure name={t.yourPrice} value={f.yourPrice!} per={per} />}
          </>
        ) : null}
        {(o.kind === 'HOLD' || o.kind === 'ANSWER_HOLD') && f.yourPrice !== null && (
          <Figure name={t.yourPrice} value={f.yourPrice} per={per} />
        )}
        {(o.kind === 'MEET' || o.kind === 'DECLINE') && f.clientPrice !== null && (
          <Figure name={t.clientPrice} value={f.clientPrice} per={per} label={clientLabel} />
        )}
        {o.kind === 'CONFIRM' && f.agreed !== null && (
          <Figure
            name={t.agreed}
            value={f.agreed}
            per={per}
            label={f.agreed === plan.clientPrice ? clientLabel : 'CALCULATION'}
          />
        )}
        {o.kind === 'SCOPE' && sc?.status === 'ready' && (
          <>
            <Figure name={t.scopePrice} value={sc.figures.price} per={per} />
            <Figure name={t.scopeFloor} value={sc.figures.floor} per={per} />
            {plan.yourPrice !== sc.figures.price && (
              <Figure name={t.yourPrice} value={plan.yourPrice} per={per} />
            )}
          </>
        )}
      </dl>
      {o.kind === 'TRADE' && o.condition !== null && (
        <Labelled
          label={prefs.condition === null ? 'RECOMMENDATION' : 'USER DECISION'}
          as="p"
          className="option-asks"
        >
          <span>
            <strong>{t.asksBack}:</strong> {CONDITION_COPY[o.condition]}
          </span>
        </Labelled>
      )}
      {o.kind === 'SCOPE' && (
        <div className="option-scope">
          <Field
            id="scopeEffort"
            label={t.scopeEffort(hours ? 'hours' : 'days')}
            hint={t.scopeHint}
            inputMode="decimal"
            value={prefs.reducedEffort ?? ''}
            error={sc?.status === 'invalid' ? t.scopeErrors[sc.error] : undefined}
            onChange={(v) => setPrefs({ reducedEffort: v.trim() === '' ? null : v })}
          />
          {sc?.status === 'needs_effort' && <p className="note">{t.scopeNeeds}</p>}
        </div>
      )}
      <Labelled label="RECOMMENDATION" as="p" className="option-why">
        <span>
          <strong>{t.why}:</strong> {REASONS[o.reason]}
        </span>
      </Labelled>
      <p className="option-risk">
        <strong>{t.risk}:</strong> {REASONS[o.risk]}
      </p>
      <div className="actions">
        <Button
          variant={first ? 'primary' : 'secondary'}
          disabled={!draftable(o)}
          aria-describedby={draftable(o) ? undefined : `${titleId}-needs`}
          onClick={onDraft}
        >
          {t.draft}
        </Button>
        {!draftable(o) && (
          <span id={`${titleId}-needs`} className="note">
            {t.draftNeedsEffort}
          </span>
        )}
      </div>
    </Glass>
  );
}

export function Options({
  plan,
  ladder,
  their,
  moveName,
  prefs,
  setPrefs,
  onDraft,
  onOwn,
  onBack,
}: {
  plan: Plan;
  ladder: LadderOk;
  their: TheirSide;
  moveName: string | null;
  prefs: ReplyPrefs;
  setPrefs: (p: Partial<ReplyPrefs>) => void;
  onDraft: (o: PlanOption) => void;
  onOwn: () => void;
  onBack: () => void;
}) {
  const h = useRef<HTMLHeadingElement>(null);
  useEffect(() => h.current?.focus(), []);
  const per = perUnit(ladder);
  const source =
    plan.priceSource === 'quote'
      ? t.fromQuote
      : plan.priceSource === 'opening'
        ? t.fromOpening
        : t.fromTarget;
  return (
    <section className="screen options" aria-labelledby="options-title">
      <header className="screen-head">
        <h2 id="options-title" tabIndex={-1} ref={h}>
          {t.title}
        </h2>
        <p className="lede">{t.lede}</p>
      </header>

      <Glass className="options-context">
        <dl className="option-figures">
          <div className="option-figure">
            <dt>{t.theirMove}</dt>
            <dd>
              {moveName === null ? '—' : <Labelled label={their.moveLabel}>{moveName}</Labelled>}
            </dd>
          </div>
          <div className="option-figure">
            <dt>{t.theirAmount}</dt>
            <dd>
              {their.amount === null ? (
                t.noAmount
              ) : (
                <Labelled label={their.amountLabel}>{formatINR(their.amount)}</Labelled>
              )}
            </dd>
          </div>
          <Figure name={t.yourPrice} value={plan.yourPrice} per={per} extra={source} />
          <Figure name={t.floor} value={ladder.floor} per={per} extra={t.floorNote} />
        </dl>
        {plan.notes.length > 0 && (
          // the live region wraps the list: role="status" on the <ul> itself would replace its
          // list role and leave the <li> items without a list (axe "listitem")
          <div role="status">
            <ul className="options-notes">
              {plan.notes.map((n) => (
                <li key={n}>{NOTE_COPY[n]}</li>
              ))}
            </ul>
          </div>
        )}
      </Glass>

      <ol className="option-list">
        {plan.options.map((o, i) => (
          <OptionCard
            key={o.kind}
            o={o}
            plan={plan}
            ladder={ladder}
            prefs={prefs}
            setPrefs={setPrefs}
            first={i === 0}
            clientLabel={their.amountLabel}
            onDraft={() => onDraft(o)}
          />
        ))}
      </ol>

      <div className="actions">
        <Button onClick={onOwn}>{t.own}</Button>
        <Button variant="quiet" onClick={onBack}>
          {t.back}
        </Button>
      </div>
    </section>
  );
}
