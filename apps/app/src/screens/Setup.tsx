import { useState, type FormEvent, type ReactNode } from 'react';
import { copy } from '../copy.ts';
import type { DealForm } from '../form.ts';
import { Button, Field as TextField, Glass, type FieldName as Field } from '../components/ui.tsx';

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
        <label key={k} className="choice-option">
          <input
            type="radio"
            name={props.name}
            value={k}
            checked={props.value === k}
            onChange={() => props.onChange(k)}
          />
          <span>{props.options[k]}</span>
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
    <form className="screen setup" onSubmit={submit} noValidate aria-labelledby="setup-title">
      <header className="screen-head">
        <h2 id="setup-title" tabIndex={-1}>
          {copy.setup.title}
        </h2>
        <p className="lede">{copy.setup.lede}</p>
      </header>
      <Glass as="section" className="group" aria-labelledby="setup-work">
        <h3 id="setup-work" className="group-title">
          {copy.setup.groupWork}
        </h3>
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
      </Glass>
      <Glass as="section" className="group" aria-labelledby="setup-money">
        <h3 id="setup-money" className="group-title">
          {copy.setup.groupMoney}
        </h3>
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
      </Glass>
      <button
        type="button"
        className="btn btn-quiet more-toggle"
        aria-expanded={more}
        aria-controls="more-detail"
        onClick={() => setMore((m) => !m)}
      >
        <span>{copy.setup.more}</span>
        <span className="disclosure-icon" aria-hidden="true" />
      </button>
      <div
        className="glass group"
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
      <div className="form-actions">
        <Button type="submit" variant="primary">
          {copy.setup.submit}
        </Button>
      </div>
    </form>
  );
}
