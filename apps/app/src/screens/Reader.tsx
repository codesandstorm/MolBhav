import { useEffect, useId, useRef } from 'react';
import type { Analysis, AmountFlag, Move, Objection, Unit } from '@molbhav/analyser';
import { LOW_CONFIDENCE, MAX_TEXT, MOVES, OBJECTIONS, UNITS } from '@molbhav/analyser/labels';
import { analyseMessage } from '../analyser.ts';
import { copy } from '../copy.ts';
import { Labelled } from '../components/Labelled.tsx';
import { Button, Disclosure, Field, Glass } from '../components/ui.tsx';
import { Choice } from './Setup.tsx';

/**
 * S4b "Read your client's reply". The message is analysed in the Web Worker on this device;
 * every output is an ESTIMATE with its confidence and the caveat, and every part can be
 * overridden by the user (USER DECISION). The manual picker is always there (A9). State lives
 * in memory only (App), and "Delete everything" resets it.
 */
export type QuoteSent = 'yes' | 'no' | 'unknown';

export interface ReaderState {
  text: string;
  quoteSent: QuoteSent;
  status: 'idle' | 'reading' | 'done' | 'error';
  emptyError: boolean;
  analysis: Analysis | null;
  moveOverride: Move | null;
  objectionOverride: Objection | 'NONE' | null;
  /** null = untouched (the parsed amount is shown as an ESTIMATE) */
  amountText: string | null;
  amountHighText: string | null;
  unitOverride: Unit | null;
}

export const emptyReader: ReaderState = {
  text: '',
  quoteSent: 'unknown',
  status: 'idle',
  emptyError: false,
  analysis: null,
  moveOverride: null,
  objectionOverride: null,
  amountText: null,
  amountHighText: null,
  unitOverride: null,
};

const t = copy.reader;
const pct = (x: number) => `${Math.round(x * 100)}%`;

/** Indian grouping for an amount the user can edit: 450000 → "4,50,000". */
const grouped = (n: bigint) => {
  const s = n.toString();
  if (s.length <= 3) return s;
  const head = s.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ',');
  return `${head},${s.slice(-3)}`;
};
const wholeRupees = (s: string) => /^\s*\d[\d,\s]*$/.test(s);

function Meta({ confidence }: { confidence: number | null }) {
  return (
    <span className="reader-meta">
      {confidence === null ? '' : `${t.confidence(pct(confidence))} · `}
      {t.caveat}
    </span>
  );
}

export function Reader({
  state,
  set,
  onBack,
}: {
  state: ReaderState;
  set: (patch: Partial<ReaderState>) => void;
  onBack: () => void;
}) {
  const heading = useRef<HTMLHeadingElement>(null);
  const result = useRef<HTMLHeadingElement>(null);
  const boxId = useId();
  const hintId = `${boxId}-hint`;
  const errId = `${boxId}-err`;
  useEffect(() => heading.current?.focus(), []);
  useEffect(() => {
    if (state.status === 'done' || state.status === 'error') result.current?.focus();
  }, [state.status]);

  const read = async () => {
    if (state.text.trim() === '') {
      set({ emptyError: true });
      return;
    }
    set({ ...emptyReader, text: state.text, quoteSent: state.quoteSent, status: 'reading' });
    try {
      const analysis = await analyseMessage(state.text, {
        quoteSent: state.quoteSent === 'unknown' ? null : state.quoteSent === 'yes',
      });
      set({ status: 'done', analysis });
    } catch {
      set({ status: 'error', analysis: null });
    }
  };

  const a = state.analysis;
  const showResults = state.status === 'done' || state.status === 'error';
  const move = state.moveOverride ?? a?.move ?? null;
  const confident = a !== null && a.move !== null && a.confidence >= LOW_CONFIDENCE;
  // the picker lists the best-scored moves first ("Pick one:" + chips + "something else")
  const order = a
    ? [...MOVES].sort((x, y) => a.scores[y] - a.scores[x] || MOVES.indexOf(x) - MOVES.indexOf(y))
    : [...MOVES];
  const moveOptions = Object.fromEntries(order.map((m) => [m, t.moves[m]])) as Record<Move, string>;
  const objection: Objection | 'NONE' = state.objectionOverride ?? a?.objection ?? 'NONE';
  const amount = a?.amount ?? null;
  const parsed = amount?.rupees ?? null;
  const amountValue = state.amountText ?? (parsed === null ? '' : grouped(parsed));
  const highParsed = amount?.rupeesHigh ?? null;
  const highValue = state.amountHighText ?? (highParsed === null ? '' : grouped(highParsed));
  const unit: Unit = state.unitOverride ?? amount?.unit ?? 'unspecified';
  const unclear = (amount?.flags ?? []) as AmountFlag[];

  return (
    <section className="screen reader" aria-labelledby="reader-title">
      <header className="screen-head">
        <h2 id="reader-title" tabIndex={-1} ref={heading}>
          {t.title}
        </h2>
        <p className="lede">{t.lede}</p>
      </header>

      <Glass className="reader-input">
        <div className={`field${state.emptyError ? ' field-error' : ''}`}>
          <label id={`${boxId}-label`} htmlFor={boxId}>
            {t.box}
          </label>
          <p id={hintId} className="hint" data-rule="">
            {t.boxHint}
          </p>
          <div className="textarea-row" data-user-text="">
            <textarea
              id={boxId}
              name="message"
              rows={5}
              maxLength={MAX_TEXT}
              autoComplete="off"
              spellCheck={false}
              value={state.text}
              aria-invalid={state.emptyError ? true : undefined}
              aria-describedby={[hintId, state.emptyError ? errId : ''].join(' ').trim()}
              onChange={(ev) => set({ text: ev.target.value, emptyError: false })}
            />
          </div>
          {state.emptyError && (
            <p id={errId} className="error" role="alert" data-rule="">
              <span className="error-icon" aria-hidden="true">
                !
              </span>
              {t.empty}
            </p>
          )}
        </div>
        <p className="privacy-note reader-privacy">
          <span className="lock" aria-hidden="true" />
          <span>
            <strong>{t.privacyStrong}</strong> {t.privacy}
          </span>
        </p>
        <Choice<QuoteSent>
          name="quote-sent"
          legend={t.quoteSent}
          value={state.quoteSent}
          options={t.quoteSentOptions}
          onChange={(v) => set({ quoteSent: v })}
        />
        <div className="actions">
          <Button
            variant="primary"
            onClick={() => void read()}
            disabled={state.status === 'reading'}
          >
            {t.read}
          </Button>
          <Button
            variant="quiet"
            onClick={() => set({ ...emptyReader, quoteSent: state.quoteSent })}
          >
            {t.clearText}
          </Button>
          <Button onClick={onBack}>{t.back}</Button>
        </div>
        {state.status === 'reading' && (
          <p className="note" role="status">
            {t.reading}
          </p>
        )}
      </Glass>

      {showResults && (
        <Glass as="section" className="reader-result" aria-labelledby="reader-result-title">
          <h3 id="reader-result-title" tabIndex={-1} ref={result}>
            {t.resultTitle}
          </h3>
          {state.status === 'error' && (
            <p className="error" role="alert" data-rule="">
              {t.failed}
            </p>
          )}

          {/* ---- the move */}
          <div className="reader-row" data-reader="move">
            <h4>{t.move}</h4>
            {state.moveOverride !== null ? (
              <Labelled label="USER DECISION" as="p" className="reader-value">
                <span>{t.moves[state.moveOverride]}</span>
                <span className="reader-meta">{t.youPicked}</span>
              </Labelled>
            ) : a?.move ? (
              <Labelled label="ESTIMATE" as="p" className="reader-value">
                <span>{t.moves[a.move]}</span>
                <Meta confidence={a.confidence} />
              </Labelled>
            ) : null}
            {move === 'PRICE_POSITION' && (
              <p className="reader-sub">
                {a?.anchorOrCounter && state.moveOverride === null ? (
                  <Labelled label="ESTIMATE" className="reader-value reader-value-sub">
                    <span>{a.anchorOrCounter === 'ANCHOR' ? t.anchor : t.counter}</span>
                    <Meta confidence={a.confidence} />
                  </Labelled>
                ) : state.quoteSent === 'unknown' ? (
                  t.anchorUnknown
                ) : (
                  <Labelled label="USER DECISION">
                    {state.quoteSent === 'yes' ? t.counter : t.anchor}
                  </Labelled>
                )}
              </p>
            )}
            {move === 'CONCESSION' &&
              a?.conditional !== null &&
              a?.conditional !== undefined &&
              state.moveOverride === null && (
                <p className="reader-sub">
                  <Labelled label="ESTIMATE" className="reader-value reader-value-sub">
                    <span>{a.conditional ? t.conditional : t.unconditional}</span>
                    <Meta confidence={a.confidence} />
                  </Labelled>
                </p>
              )}
            <div
              className={`reader-picker${confident || state.moveOverride ? '' : ' reader-picker-open'}`}
            >
              <Choice<Move>
                name="move-pick"
                legend={
                  state.moveOverride || confident
                    ? t.pickYourself
                    : a?.move
                      ? t.lowConfidence
                      : t.noMove
                }
                value={(state.moveOverride ?? '') as Move}
                options={moveOptions}
                onChange={(v) => set({ moveOverride: v })}
              />
            </div>
          </div>

          {/* ---- the objection */}
          <div className="reader-row" data-reader="objection">
            <h4>{t.objection}</h4>
            {state.objectionOverride !== null ? (
              <Labelled label="USER DECISION" as="p" className="reader-value">
                <span>{t.objections[state.objectionOverride]}</span>
                <span className="reader-meta">{t.youPicked}</span>
              </Labelled>
            ) : (
              <Labelled label="ESTIMATE" as="p" className="reader-value">
                <span>{t.objections[objection]}</span>
                <Meta confidence={a?.objection ? a.objectionConfidence : null} />
              </Labelled>
            )}
            <div className="field reader-select">
              <label htmlFor={`${boxId}-objection`}>{t.objectionPick}</label>
              <div className="input-row">
                <select
                  id={`${boxId}-objection`}
                  value={objection}
                  onChange={(ev) =>
                    set({ objectionOverride: ev.target.value as Objection | 'NONE' })
                  }
                >
                  {[...OBJECTIONS, 'NONE' as const].map((o) => (
                    <option key={o} value={o}>
                      {t.objections[o]}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* ---- the amount: a USER DECISION the user can correct */}
          <div className="reader-row" data-reader="amount">
            <h4>{t.amount}</h4>
            {parsed !== null && state.amountText === null && (
              <Labelled label="ESTIMATE" as="p" className="reader-value">
                <span>
                  {t.unitLine(t.units[unit])} ·{' '}
                  {unclear.length === 0 ? t.clear : unclear.map((f) => t.unclear[f]).join('; ')}
                </span>
                <Meta confidence={null} />
              </Labelled>
            )}
            {parsed === null && unclear.length > 0 && (
              <Labelled label="ESTIMATE" as="p" className="reader-value">
                <span>{unclear.map((f) => t.unclear[f]).join('; ')}</span>
                <Meta confidence={null} />
              </Labelled>
            )}
            <Field
              id="amount"
              label={parsed === null ? t.noAmount : t.amount}
              hint={parsed === null ? t.noAmountHint : t.amountHint}
              prefix="₹"
              inputMode="numeric"
              value={amountValue}
              error={amountValue !== '' && !wholeRupees(amountValue) ? t.amountError : undefined}
              claim={
                state.amountText === null
                  ? parsed === null
                    ? undefined
                    : 'ESTIMATE'
                  : 'USER DECISION'
              }
              onChange={(v) => set({ amountText: v })}
            />
            {(highParsed !== null || state.amountHighText !== null) && (
              <Field
                id="amountHigh"
                label={t.amountHigh}
                prefix="₹"
                inputMode="numeric"
                value={highValue}
                error={highValue !== '' && !wholeRupees(highValue) ? t.amountError : undefined}
                claim={state.amountHighText === null ? 'ESTIMATE' : 'USER DECISION'}
                onChange={(v) => set({ amountHighText: v })}
              />
            )}
            <div className="field reader-select">
              <label htmlFor={`${boxId}-unit`}>{t.unit}</label>
              <div className="input-row">
                <select
                  id={`${boxId}-unit`}
                  value={unit}
                  onChange={(ev) => set({ unitOverride: ev.target.value as Unit })}
                >
                  {UNITS.map((u) => (
                    <option key={u} value={u}>
                      {t.units[u]}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* ---- the evidence */}
          {a && a.evidence.length + (amount?.span ? 1 : 0) > 0 && (
            <Disclosure summary={t.evidence}>
              <ul className="reader-evidence">
                {a.evidence.map((e) => (
                  <li key={`${e.rule}-${e.start}`}>
                    <q data-user-text="">{e.phrase}</q> {t.evidenceFor}{' '}
                    {e.supports === 'conditional'
                      ? t.conditionalCue
                      : (MOVES as readonly string[]).includes(e.supports)
                        ? t.moves[e.supports as Move]
                        : t.objections[e.supports as Objection]}
                  </li>
                ))}
                {amount?.span && (
                  <li>
                    <q data-user-text="">{amount.span.text}</q> {t.evidenceFor} {t.clientPrice}
                  </li>
                )}
              </ul>
            </Disclosure>
          )}
          <p className="note">{t.notScored}</p>
        </Glass>
      )}
    </section>
  );
}
