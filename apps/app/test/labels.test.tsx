import 'fake-indexeddb/auto';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { App } from '../src/App.tsx';

/**
 * S7 rule: no number can render without a label.
 * Every text node containing a digit must sit inside one of:
 *   [data-label]      a claim: FACT / CALCULATION / ESTIMATE / USER DECISION / RECOMMENDATION, with a visible chip
 *   [data-rule]       a form rule or validation limit (hints, errors, the 18+ line): not a claim
 *   [data-source]     a source reference in the evidence log (file paths, section numbers)
 *   [data-user-text]  something the user typed themselves (deal names, form values)
 * Money is stricter: any "₹" must sit inside [data-label] or [data-user-text]; a rule or a source
 * reference may not show a rupee amount.
 * The same applies to the attributes aria-label, placeholder, title and alt, and to the value of
 * every input and textarea.
 */
const LABELS = new Set(['FACT', 'CALCULATION', 'ESTIMATE', 'USER DECISION', 'RECOMMENDATION']);
const DIGIT_OK = '[data-label],[data-rule],[data-source],[data-user-text]';
const RUPEE_OK = '[data-label],[data-user-text]';
const ATTRS = ['aria-label', 'placeholder', 'title', 'alt'];

const violation = (text: string, el: Element | null): string | null => {
  if (text.includes('₹') && !el?.closest(RUPEE_OK)) return `₹ outside a label: ${text.trim()}`;
  if (/\d/.test(text) && !el?.closest(DIGIT_OK)) return text.trim();
  return null;
};

const unlabelledDigits = (root: HTMLElement): string[] => {
  const bad: string[] = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    const v = violation(n.textContent ?? '', n.parentElement);
    if (v) bad.push(v);
  }
  for (const el of root.querySelectorAll('*')) {
    for (const a of ATTRS) {
      const v = el.hasAttribute(a) ? violation(el.getAttribute(a) ?? '', el) : null;
      if (v) bad.push(`[${a}] ${v}`);
    }
    if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
      const v = violation(el.value, el);
      if (v) bad.push(`[value] ${v}`);
    }
  }
  for (const el of root.querySelectorAll<HTMLElement>('[data-label]')) {
    const label = el.dataset.label ?? '';
    if (!LABELS.has(label)) bad.push(`unknown label ${label}`);
    const chip = el.querySelector(':scope > .chip');
    if (chip?.textContent !== label)
      bad.push(`missing visible chip for ${label}: ${el.textContent}`);
  }
  return bad;
};

afterEach(cleanup);

describe('no unlabelled number can render (S7)', () => {
  it('welcome, ladder with trace and quote, evidence log, setup with errors, settings', async () => {
    const { container } = render(<App />);
    expect(unlabelledDigits(container)).toEqual([]);

    fireEvent.click(screen.getByRole('button', { name: 'Try an example deal' }));
    await screen.findByRole('heading', { name: 'Your price ladder' });
    for (const d of container.querySelectorAll('details')) d.open = true;
    expect(container.textContent).toContain('₹38,000');
    expect(unlabelledDigits(container)).toEqual([]);

    fireEvent.click(screen.getByRole('button', { name: 'Evidence log' }));
    await screen.findByRole('heading', { name: 'Evidence log' });
    expect(unlabelledDigits(container)).toEqual([]);

    fireEvent.click(screen.getByRole('button', { name: 'Back to the ladder' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Change inputs' }));
    const k = await screen.findByLabelText('How many days can you bill in a month?');
    fireEvent.change(k, { target: { value: '45' } });
    fireEvent.click(screen.getByRole('button', { name: 'Calculate my ladder' }));
    await screen.findByText('A month has at most 31 days (744 hours)');
    expect(unlabelledDigits(container)).toEqual([]);

    fireEvent.click(screen.getByRole('button', { name: 'Settings and privacy' }));
    await screen.findByRole('heading', { name: 'Settings and privacy' });
    expect(unlabelledDigits(container)).toEqual([]);
  });

  it('the checker itself catches each kind of violation', () => {
    const div = document.createElement('div');
    div.innerHTML = [
      '<p>Floor ₹38,000</p>',
      '<span data-label="CALCULATION">₹1 <span class="chip">CALCULATION</span></span>',
      '<p data-rule>At least ₹500</p>',
      '<p data-source>Spec §3.5 says ₹100</p>',
      '<p data-rule>At most 31 days</p>',
      '<button aria-label="Pay ₹200">Pay</button>',
      '<img alt="3 steps" src="">',
      '<input placeholder="e.g. 7" value="">',
      '<span title="₹9" data-rule>x</span>',
      '<input value="45000">',
      '<input data-user-text value="45000">',
    ].join('');
    expect(unlabelledDigits(div)).toEqual([
      '₹ outside a label: Floor ₹38,000',
      '₹ outside a label: At least ₹500',
      '₹ outside a label: Spec §3.5 says ₹100',
      '[aria-label] ₹ outside a label: Pay ₹200',
      '[alt] 3 steps',
      '[placeholder] e.g. 7',
      '[title] ₹ outside a label: ₹9',
      '[value] 45000',
    ]);
  });
});
