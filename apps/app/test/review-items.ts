/**
 * Every C1 wording the owner must review, with a stable id and its exact text: the templates,
 * the option names and meanings, reasons and risks, trade conditions, plan notes, and the S5/S6
 * screen copy. docs/product/17_c1_review_checklist.md is generated from this list
 * (scripts/review-checklist.ts) and test/review-checklist.test.ts checks that it lists them all.
 */
import {
  CONDITION_COPY,
  CONDITION_TEXT,
  NOTE_COPY,
  OPTION_COPY,
  REASONS,
  TEMPLATES,
} from '@molbhav/planner';
import { copy } from '../src/copy.ts';

export interface ReviewItem {
  id: string;
  group: string;
  text: string;
}

/** flatten a copy section; functions are shown with a placeholder argument */
const flatten = (prefix: string, group: string, o: object): ReviewItem[] =>
  Object.entries(o).flatMap(([k, v]): ReviewItem[] => {
    const id = `${prefix}-${k}`;
    if (typeof v === 'string') return [{ id, group, text: v }];
    if (typeof v === 'function') {
      const arg = k === 'scopeEffort' ? 'days' : '{amount}';
      return [{ id, group, text: String((v as (a: string) => string)(arg)) }];
    }
    return flatten(id, group, v as object);
  });

export const reviewItems = (): ReviewItem[] => [
  ...TEMPLATES.map((t) => ({ id: t.id, group: 'Templates', text: t.text })),
  ...Object.entries(CONDITION_TEXT).flatMap(([lang, m]) =>
    Object.entries(m).map(([c, text]) => ({
      id: `CT-${c}-${lang === 'en' ? 'EN' : 'HI'}`,
      group: 'Trade conditions in drafts',
      text,
    })),
  ),
  ...Object.entries(OPTION_COPY).flatMap(([k, v]) => [
    { id: `O-${k}-name`, group: 'Option names and meanings', text: v.name },
    { id: `O-${k}-meaning`, group: 'Option names and meanings', text: v.meaning },
  ]),
  ...Object.entries(REASONS).map(([k, text]) => ({
    id: k,
    group: k.startsWith('risk.') ? 'Risks' : 'Reasons (RECOMMENDATION)',
    text,
  })),
  ...Object.entries(CONDITION_COPY).map(([k, text]) => ({
    id: `C-${k}`,
    group: 'Trade conditions on screen (USER DECISION)',
    text,
  })),
  ...Object.entries(NOTE_COPY).map(([k, text]) => ({ id: `N-${k}`, group: 'Plan notes', text })),
  ...flatten('UI-O', 'Screen copy: Your options (S5)', copy.options),
  ...flatten('UI-D', 'Screen copy: Draft your reply (S6)', copy.draft),
];

/** one table cell: pipes escaped, line breaks removed */
export const cell = (s: string) => s.replace(/\|/g, '\\|').replace(/\s*\n\s*/g, ' ');
