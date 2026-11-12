import { useEffect, useId, useMemo, useRef, useState } from 'react';
import {
  ADVANCE_PCTS,
  CONDITION_COPY,
  CONDITIONS,
  EDIT_MARK,
  OPTION_COPY,
  checkDraft,
  type AllowedNumbers,
  type ConditionId,
  type Lang,
  type OptionKind,
  type Tone,
} from '@molbhav/planner';
import { copy } from '../copy.ts';
import { Labelled } from '../components/Labelled.tsx';
import { Button, Glass, Toast } from '../components/ui.tsx';
import { Choice } from './Setup.tsx';

/**
 * S6 "Draft your reply" (Phase C1). The draft is a template filled with the option's numbers
 * (packages/planner templates.ts and draft.ts); the user edits it and copies it. Nothing is sent
 * anywhere. This screen never receives the client's message: its input is the option kind, the
 * user's choices and the numbers it may use (AllowedNumbers), and the user's own draft text.
 *
 * The post-check (checkDraft, A5) runs on every edit; the "all numbers come from your ladder"
 * line appears only when it passed.
 *
 * Extension point (Phase C2, not built): an LLM wording path would send the same DraftRequest
 * (enumerated fields and numbers only) to POST /v1/draft, run its output through the same
 * checkDraft, and fall back to the template on any failure (docs/product/09_architecture.md §4).
 * There is no toggle for it in this phase.
 */
const t = copy.draft;

export interface DraftChoices {
  lang: Lang;
  tone: Tone;
  condition: ConditionId | null;
  advancePct: 25n | 50n;
}

export function Draft({
  kind,
  choices,
  setChoices,
  text,
  setText,
  stale,
  onRebuild,
  allowed,
  onBack,
  backLabel,
}: {
  /** null: the user writes their own reply */
  kind: OptionKind | null;
  choices: DraftChoices;
  setChoices: (c: Partial<DraftChoices>) => void;
  text: string;
  setText: (s: string) => void;
  /** the draft was edited, so new choices did not replace it */
  stale: boolean;
  onRebuild: () => void;
  allowed: AllowedNumbers;
  onBack: () => void;
  backLabel: string;
}) {
  const h = useRef<HTMLHeadingElement>(null);
  useEffect(() => h.current?.focus(), []);
  const id = useId();
  const [copied, setCopied] = useState<'idle' | 'ok' | 'failed'>('idle');
  const box = useRef<HTMLTextAreaElement>(null);
  const check = useMemo(() => checkDraft(text, allowed), [text, allowed]);
  const empty = text.trim() === '';
  const needsEdit = text.includes(EDIT_MARK);

  const copyDraft = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied('ok');
    } catch {
      // no clipboard here (an old browser, or permission refused): select it for the user
      box.current?.select();
      setCopied('failed');
    }
  };

  const advanceOptions = Object.fromEntries(
    ADVANCE_PCTS.map((p) => [String(p), `${p}%`]),
  ) as Record<string, string>;

  return (
    <section className="screen draft" aria-labelledby="draft-title">
      <header className="screen-head">
        <h2 id="draft-title" tabIndex={-1} ref={h}>
          {t.title}
        </h2>
        <p className="lede">{t.lede}</p>
      </header>

      <Glass className="draft-choices">
        <Labelled label="USER DECISION" as="p" className="reader-value">
          <span>
            <strong>{t.option}:</strong> {kind === null ? t.own : OPTION_COPY[kind].name}
          </span>
        </Labelled>
        {kind !== null && (
          <>
            <Choice<Lang>
              name="draft-lang"
              legend={t.lang}
              value={choices.lang}
              options={t.langs}
              onChange={(v) => setChoices({ lang: v })}
            />
            <Choice<Tone>
              name="draft-tone"
              legend={t.tone}
              value={choices.tone}
              options={t.tones}
              onChange={(v) => setChoices({ tone: v })}
            />
          </>
        )}
        {kind === 'TRADE' && (
          <>
            <div className="field reader-select">
              <label htmlFor={`${id}-condition`}>{t.condition}</label>
              <div className="input-row">
                <select
                  id={`${id}-condition`}
                  value={choices.condition ?? ''}
                  onChange={(ev) => setChoices({ condition: ev.target.value as ConditionId })}
                >
                  {CONDITIONS.map((c) => (
                    <option key={c} value={c}>
                      {CONDITION_COPY[c]}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {choices.condition === 'ADVANCE' && (
              // a fixed list of allowed shares: a rule, not a claim
              <div data-rule="">
                <Choice<string>
                  name="draft-advance"
                  legend={t.advance}
                  value={String(choices.advancePct)}
                  options={advanceOptions}
                  onChange={(v) => setChoices({ advancePct: BigInt(v) as 25n | 50n })}
                />
              </div>
            )}
          </>
        )}
        {stale && (
          <div className="draft-stale">
            <p className="note" role="status">
              {t.rebuildNote}
            </p>
            <Button onClick={onRebuild}>{t.rebuild}</Button>
          </div>
        )}
      </Glass>

      <Glass className="draft-box">
        <div className="field">
          <label htmlFor={id}>{t.box}</label>
          <p id={`${id}-hint`} className="hint">
            {t.boxHint}
          </p>
          <div className="textarea-row" data-user-text="">
            <textarea
              id={id}
              ref={box}
              name="draft"
              rows={7}
              autoComplete="off"
              value={text}
              aria-describedby={`${id}-hint ${id}-check`}
              onChange={(ev) => {
                setCopied('idle');
                setText(ev.target.value);
              }}
            />
          </div>
        </div>
        <div id={`${id}-check`} className="draft-check" aria-live="polite">
          {empty ? (
            <p className="note">{t.checkEmpty}</p>
          ) : check.ok ? (
            <Labelled label="CALCULATION" as="p" className="draft-ok">
              <span>
                <span className="check-mark" aria-hidden="true" />
                {t.checkOk}
              </span>
            </Labelled>
          ) : (
            <div className="draft-fail">
              <p>{t.checkFail}:</p>
              <ul>
                {check.offending.map((f) => (
                  <li key={`${f.start}-${f.end}-${f.reason}`}>
                    <q data-user-text="">{f.text}</q> {t.reasons[f.reason ?? 'not_allowed']}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {needsEdit && <p className="note">{t.needsEdit}</p>}
        </div>
        <p className="privacy-note">
          <span className="lock" aria-hidden="true" />
          <span>{t.sentNote}</span>
        </p>
        <div className="actions">
          <Button variant="primary" onClick={() => void copyDraft()} disabled={empty}>
            {t.copy}
          </Button>
          <Button variant="quiet" onClick={onBack}>
            {backLabel}
          </Button>
        </div>
      </Glass>
      {copied === 'ok' && <Toast>{t.copied}</Toast>}
      {copied === 'failed' && <Toast>{t.copyFailed}</Toast>}
    </section>
  );
}
