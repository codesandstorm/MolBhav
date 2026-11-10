import { formatINR, type LadderOk } from '@molbhav/engine';
import type { ClaimLabel } from './components/Labelled.tsx';
import type { DealForm } from './form.ts';
import { copy } from './copy.ts';

/** One row of the evidence log (S7). */
export interface Claim {
  id: string;
  what: string;
  value: string;
  label: ClaimLabel;
  source: string;
}

const per = (r: LadderOk) => (r.unit === 'hour' ? '/hour' : r.unit === 'month' ? '/month' : '');
const SPEC = 'Price ladder formula, docs/product/13_price_ladder_spec.md';

export const claimsFor = (f: DealForm, r: LadderOk): Claim[] => {
  const p = per(r);
  const rows: Claim[] = [
    {
      id: 'floor',
      what: 'Floor',
      value: formatINR(r.floor) + p,
      label: 'CALCULATION',
      source: `${SPEC} §3.1, §3.3`,
    },
    {
      id: 'target',
      what: 'Target',
      value: formatINR(r.target) + p,
      label: 'CALCULATION',
      source: `${SPEC} §3.2, §3.3`,
    },
    {
      id: 'opening',
      what: 'Opening',
      value: formatINR(r.opening) + p,
      label: 'CALCULATION',
      source: `${SPEC} §3.2, §3.3`,
    },
    {
      id: 'room',
      what: 'Concession room',
      value: r.opening === r.target ? 'No room at this price' : `${r.concessionRoomPct}%`,
      label: 'CALCULATION',
      source: `${SPEC} v0.3 §3.5: (opening − target) ÷ opening, from the rounded rungs, rounded down`,
    },
  ];
  if (r.quote && 'position' in r.quote)
    rows.push({
      id: 'quote_position',
      what: 'Where your quote sits',
      value: copy.ladder.quotePositions[r.quote.position],
      label: 'CALCULATION',
      source: `${SPEC} §3.4`,
    });
  const unitWord = r.inputs.eu === 'hour' ? 'hours' : 'days';
  const you = 'You entered this';
  rows.push(
    {
      id: 'u',
      what: 'Priced',
      value: copy.setup.unitOptions[f.u],
      label: 'USER DECISION',
      source: you,
    },
    ...(r.inputs.e
      ? [
          {
            id: 'e',
            what: 'Work',
            value: `${f.e.trim()} ${unitWord}`,
            label: 'USER DECISION' as const,
            source: you,
          },
        ]
      : []),
    {
      id: 'K',
      what: 'Billable per month',
      value: `${f.K.trim()} ${unitWord}`,
      label: 'USER DECISION',
      source: you,
    },
    {
      id: 'M',
      what: 'Monthly need',
      value: formatINR(r.inputs.M.n),
      label: 'USER DECISION',
      source: you,
    },
    {
      id: 'C',
      what: 'Direct costs',
      value: f.C.trim() === '' ? 'No costs (left empty)' : formatINR(r.inputs.C.n),
      label: 'USER DECISION',
      source: you,
    },
    {
      id: 'b',
      what: 'Buffer',
      value: f.b.trim() === '' ? 'No buffer (left empty)' : `${r.inputs.b}%`,
      label: 'USER DECISION',
      source: you,
    },
    {
      id: 't',
      what: 'Target margin',
      value: `${r.inputs.t}%`,
      label: f.tEdited ? 'USER DECISION' : 'RECOMMENDATION',
      source: f.tEdited ? you : 'Suggested default (D-L2): leaves a margin above your floor',
    },
    {
      id: 'a',
      what: 'Opening room',
      value: `${r.inputs.a}%`,
      label: f.aEdited ? 'USER DECISION' : 'RECOMMENDATION',
      source: f.aEdited
        ? you
        : 'Suggested default (D-L2): room for one or two concessions that still land on target',
    },
  );
  if (r.quote && 'position' in r.quote)
    rows.push({
      id: 'Q',
      what: 'Your quote',
      value: formatINR(r.quote.differenceFromFloor + r.floor) + p,
      label: 'USER DECISION',
      source: you,
    });
  return rows;
};
