import { useId, useState, type FormEvent, type ReactNode } from 'react';
import { copy } from '../copy.ts';
import type { DealForm } from '../form.ts';
import { Labelled, type ClaimLabel } from '../components/Labelled.tsx';

type Field = 'name' | 'e' | 'K' | 'M' | 'C' | 'b' | 't' | 'a' | 'Q';

function TextField(props: {
  id: Field;
  label: string;
  hint?: string;
  value: string;
  error?: string | undefined;
  onChange: (v: string) => void;
  inputMode?: 'decimal' | 'numeric' | 'text';
  prefix?: string;
  /** a pre-filled suggestion the user has not changed: shown with its label chip */
  claim?: ClaimLabel | undefined;
}) {
  const uid = useId();
  const hintId = `${uid}-hint`;
  const errId = `${uid}-err`;
  const describedBy = [props.hint ? hintId : null, props.error ? errId : null]
    .filter(Boolean)
    .join(' ');
  const control = (
    <>
      {props.prefix && <span aria-hidden="true">{props.prefix}</span>}
      <input
        id={uid}
        name={props.id}
        type="text"
        inputMode={props.inputMode ?? 'decimal'}
        autoComplete="off"
        value={props.value}
        aria-invalid={props.error ? true : undefined}
        aria-describedby={describedBy || undefined}
        onChange={(ev) => props.onChange(ev.target.value)}
      />
    </>
  );
  return (
    <div className="field">
      <label htmlFor={uid}>{props.label}</label>
      {props.hint && (
        <p id={hintId} className="hint" data-rule="">
          {props.hint}
        </p>
      )}
      {/* What the user typed is their own text; an untouched suggestion carries its label. */}
      {props.claim ? (
        <Labelled label={props.claim} as="div" className="input-row">
          {control}
        </Labelled>
      ) : (
        <div className="input-row" data-user-text="">
          {control}
        </div>
      )}
      {props.error && (
        <p id={errId} className="error" role="alert" data-rule="">
          {props.error}
        </p>
      )}
    </div>
  );
}

function Choice<T extends string>(props: {
  name: string;
  legend: string;
  value: T;
  options: Record<T, string>;
  onChange: (v: T) => void;
}): ReactNode {
  return (
    <fieldset className="choice">
      <legend>{props.legend}</legend>
      {(Object.keys(props.options) as T[]).map((k) => (
        <label key={k}>
          <input
            type="radio"
            name={props.name}
            value={k}
            checked={props.value === k}
            onChange={() => props.onChange(k)}
          />
          {props.options[k]}
        </label>
      ))}
    </fieldset>
  );
}

export function Setup({
  initial,
  errors,
  onSubmit,
}: {
  initial: DealForm;
  errors: Partial<Record<Field, string>>;
  onSubmit: (f: DealForm) => void;
}) {
  const [f, setF] = useState<DealForm>(initial);
  const [more, setMore] = useState(
    initial.b !== '' || initial.tEdited || initial.aEdited || initial.Q !== '',
  );
  const set = <K extends keyof DealForm>(k: K, v: DealForm[K]) => setF((x) => ({ ...x, [k]: v }));
  const hours = f.u === 'hour' || f.eu === 'hour';
  const submit = (ev: FormEvent) => {
    ev.preventDefault();
    onSubmit(f);
  };
  return (
    <form onSubmit={submit} noValidate aria-labelledby="setup-title">
      <h2 id="setup-title" tabIndex={-1}>
        {copy.setup.title}
      </h2>
      <TextField
        id="name"
        label={copy.setup.name}
        hint={copy.setup.nameHint}
        inputMode="text"
        value={f.name}
        onChange={(v) => set('name', v)}
      />
      <Choice
        name="u"
        legend={copy.setup.unit}
        value={f.u}
        options={copy.setup.unitOptions}
        onChange={(v) => setF((x) => ({ ...x, u: v, eu: v === 'hour' ? 'hour' : x.eu }))}
      />
      {f.u !== 'hour' && (
        <Choice
          name="eu"
          legend={copy.setup.effortUnit}
          value={f.eu}
          options={copy.setup.effortUnitOptions}
          onChange={(v) => set('eu', v)}
        />
      )}
      <TextField
        id="e"
        label={copy.setup.effort[f.u]}
        value={f.e}
        error={errors.e}
        onChange={(v) => set('e', v)}
      />
      <TextField
        id="K"
        label={hours ? copy.setup.capacityHours : copy.setup.capacity}
        hint={hours ? copy.setup.capacityHintHours : copy.setup.capacityHint}
        value={f.K}
        error={errors.K}
        onChange={(v) => set('K', v)}
      />
      <TextField
        id="M"
        label={copy.setup.need}
        hint={copy.setup.needHint}
        prefix="₹"
        inputMode="numeric"
        value={f.M}
        error={errors.M}
        onChange={(v) => set('M', v)}
      />
      <TextField
        id="C"
        label={copy.setup.costs}
        hint={f.u === 'month' ? copy.setup.costsMonthHint : copy.setup.costsHint}
        prefix="₹"
        inputMode="numeric"
        value={f.C}
        error={errors.C}
        onChange={(v) => set('C', v)}
      />
      <button
        type="button"
        className="link"
        aria-expanded={more}
        aria-controls="more-detail"
        onClick={() => setMore((m) => !m)}
      >
        {copy.setup.more}
      </button>
      <div
        id="more-detail"
        hidden={!(more || Boolean(errors.b || errors.t || errors.a || errors.Q))}
      >
        <TextField
          id="b"
          label={copy.setup.buffer}
          inputMode="numeric"
          value={f.b}
          error={errors.b}
          onChange={(v) => set('b', v)}
        />
        <TextField
          id="t"
          label={copy.setup.margin}
          hint={f.tEdited ? undefined : copy.setup.recommendedHint}
          claim={f.tEdited ? undefined : 'RECOMMENDATION'}
          inputMode="numeric"
          value={f.t}
          error={errors.t}
          onChange={(v) => setF((x) => ({ ...x, t: v, tEdited: true }))}
        />
        <TextField
          id="a"
          label={copy.setup.room}
          hint={f.aEdited ? undefined : copy.setup.recommendedHint}
          claim={f.aEdited ? undefined : 'RECOMMENDATION'}
          inputMode="numeric"
          value={f.a}
          error={errors.a}
          onChange={(v) => setF((x) => ({ ...x, a: v, aEdited: true }))}
        />
        <TextField
          id="Q"
          label={copy.setup.quote}
          prefix="₹"
          inputMode="numeric"
          value={f.Q}
          error={errors.Q}
          onChange={(v) => set('Q', v)}
        />
      </div>
      <button type="submit" className="primary">
        {copy.setup.submit}
      </button>
    </form>
  );
}
