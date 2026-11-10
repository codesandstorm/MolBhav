import type { ReactNode } from 'react';

/** The five claim labels (docs/product/02_service_catalogue.md). */
export type ClaimLabel = 'FACT' | 'CALCULATION' | 'ESTIMATE' | 'USER DECISION' | 'RECOMMENDATION';

/**
 * The only way the app renders a number that is a claim: the value plus a visible label chip.
 * The evidence-label test fails if any digit renders outside an element with data-label
 * (or a form rule marked data-rule).
 */
export function Labelled({
  label,
  children,
  as: Tag = 'span',
  className,
}: {
  label: ClaimLabel;
  children: ReactNode;
  as?: 'span' | 'div' | 'p' | 'li';
  className?: string;
}) {
  return (
    <Tag data-label={label} className={className ? `labelled ${className}` : 'labelled'}>
      {children} <span className="chip">{label}</span>
    </Tag>
  );
}
