/**
 * The shared component set (docs/product/15_design_language.md §6). Every screen is built
 * from these; their states (default, hover, focus-visible, active, disabled, error) live in
 * styles.css under the matching class names.
 */
import { useId, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Labelled, type ClaimLabel } from './Labelled.tsx';

type Variant = 'primary' | 'secondary' | 'quiet' | 'danger';

/** Pill button. Primary is the peach-copper gradient; there is at most one per screen. */
export function Button({
  variant = 'secondary',
  className,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      type="button"
      {...rest}
      className={`btn btn-${variant}${className ? ` ${className}` : ''}`}
    />
  );
}

/** Glass panel: warm tint at high opacity, hairline border, copper rim along the top edge. */
export function Glass({
  as: Tag = 'div',
  className,
  children,
  ...rest
}: {
  as?: 'div' | 'section' | 'li' | 'aside';
  className?: string;
  children: ReactNode;
  'aria-labelledby'?: string;
}) {
  return (
    <Tag {...rest} className={`glass${className ? ` ${className}` : ''}`}>
      {children}
    </Tag>
  );
}

/** A status chip for things that are not built yet. */
export function Planned() {
  return <span className="chip chip-planned">Planned</span>;
}

/** Collapsed by default; native details/summary so keyboard and screen readers just work. */
export function Disclosure({ summary, children }: { summary: string; children: ReactNode }) {
  return (
    <details className="disclosure">
      <summary>
        <span>{summary}</span>
        <span className="disclosure-icon" aria-hidden="true" />
      </summary>
      <div className="disclosure-body">{children}</div>
    </details>
  );
}

/** A polite toast, pinned to the bottom of the viewport so it never shifts the layout. */
export function Toast({ children }: { children: ReactNode }) {
  return (
    <p className="toast" role="status">
      {children}
    </p>
  );
}

/** The top bar lists only screens that exist: home (the wordmark) and settings. */
export function TopBar({
  onHome,
  onSettings,
  settingsLabel,
  current,
}: {
  onHome: () => void;
  onSettings: () => void;
  settingsLabel: string;
  current: 'settings' | 'other';
}) {
  return (
    <header className="topbar">
      <h1 className="topbar-brand">
        <button type="button" className="brand" onClick={onHome}>
          <span className="brand-mark" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
          MolBhav
        </button>
      </h1>
      <nav aria-label="Main">
        <button
          type="button"
          className="btn btn-quiet"
          aria-current={current === 'settings' ? 'page' : undefined}
          onClick={onSettings}
        >
          {settingsLabel}
        </button>
      </nav>
    </header>
  );
}

export type FieldName =
  'name' | 'e' | 'K' | 'M' | 'C' | 'b' | 't' | 'a' | 'Q' | 'amount' | 'amountHigh' | 'scopeEffort';

/** Label, hint and error, wired with aria-describedby; error text is announced. */
export function Field(props: {
  id: FieldName;
  label: string;
  hint?: string | undefined;
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
      {props.prefix && (
        <span className="field-prefix" aria-hidden="true">
          {props.prefix}
        </span>
      )}
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
    <div className={`field${props.error ? ' field-error' : ''}`}>
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
          <span className="error-icon" aria-hidden="true">
            !
          </span>
          {props.error}
        </p>
      )}
    </div>
  );
}
