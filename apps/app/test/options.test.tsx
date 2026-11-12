import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { App } from '../src/App.tsx';
import { deleteEverything, listDeals } from '../src/storage.ts';

// jsdom has no Worker: the test runs the same rules directly (the browser runs them in the Worker)
vi.mock('../src/analyser.ts', async () => {
  const { analyse } = await import('@molbhav/analyser');
  return {
    analyseMessage: async (text: string, state: { quoteSent: boolean | null }) =>
      analyse(text, state),
  };
});
afterEach(cleanup);
beforeEach(async () => {
  await deleteEverything();
});

/** made-up test messages, source "fixture", not gold */
const SENTINEL = 'ZQXCLIENT-sentinel-91';
const json = (x: unknown) => JSON.stringify(x, (_, v) => (typeof v === 'bigint' ? `${v}n` : v));
const OK = 'All numbers in this draft come from your ladder';

const readReply = async (text: string, quote: 'Yes' | 'Not yet' | 'Not sure' = 'Not yet') => {
  fireEvent.change(screen.getByLabelText('Paste what your client said'), {
    target: { value: text },
  });
  fireEvent.click(screen.getByRole('radio', { name: quote }));
  fireEvent.click(screen.getByRole('button', { name: 'Read it' }));
  await screen.findByRole('heading', { name: 'What the rules read' });
};
const toOptions = async () => {
  const ex = screen.queryByRole('button', { name: 'Use the example deal' });
  fireEvent.click(ex ?? screen.getByRole('button', { name: 'See your options for this reply' }));
  return screen.findByRole('heading', { name: 'Your options' });
};
const firstDraftable = () =>
  screen
    .getAllByRole('button', { name: 'Draft this reply' })
    .find((b) => !(b as HTMLButtonElement).disabled)!;
const draftBox = () => screen.getByLabelText('Your draft') as HTMLTextAreaElement;
const cardNames = (c: HTMLElement) =>
  [...c.querySelectorAll('.option-card h3')].map((h) => h.textContent);

const startFromReader = async () => {
  const view = render(<App />);
  fireEvent.click(screen.getByRole('button', { name: 'Read a client’s reply' }));
  await screen.findByRole('heading', { name: 'Read your client’s reply' });
  return view;
};

describe('S5 options', () => {
  it('without a ladder, the reader asks for a deal first and offers both ways in', async () => {
    const { container } = await startFromReader();
    await readReply('Too high. Can you do 40k?');
    expect(container.querySelector('.options-entry')!.textContent).toContain(
      'Options start from your price ladder',
    );
    expect(screen.getByRole('button', { name: 'Set up my deal' })).toBeTruthy();
    await toOptions();
    expect(cardNames(container).length).toBeGreaterThanOrEqual(2);
  });

  it('2 to 4 ranked options: figures CALCULATION, reasons RECOMMENDATION, the floor for the user only', async () => {
    const { container } = await startFromReader();
    await readReply('Can you do 30k?', 'Yes');
    await toOptions();
    const cards = container.querySelectorAll('.option-card');
    expect(cards.length).toBeGreaterThanOrEqual(2);
    expect(cards.length).toBeLessThanOrEqual(4);
    expect(cardNames(container)[0]).toBe('Say no politely, keep the door open');
    for (const c of cards) {
      expect(c.querySelector('.option-why')!.getAttribute('data-label')).toBe('RECOMMENDATION');
      expect(c.querySelector('.option-risk')!.textContent).toMatch(/^Risk:/);
    }
    const ctx = container.querySelector<HTMLElement>('.options-context')!;
    const floor = within(ctx).getByText('Your floor, for you only');
    expect(floor.parentElement!.textContent).toContain('₹38,000');
    expect(floor.parentElement!.querySelector('[data-label]')!.getAttribute('data-label')).toBe(
      'CALCULATION',
    );
    // the client's number keeps the reader's label, never CALCULATION
    expect(cards[0]!.querySelector('dd [data-label]')!.getAttribute('data-label')).toBe('ESTIMATE');
  });

  it('low confidence and no amount: safe options, and the screen says so', async () => {
    const { container } = await startFromReader();
    await readReply('asdf qwer', 'Not sure');
    await toOptions();
    const notes = container.querySelector('.options-notes')!.textContent;
    expect(notes).toContain('They did not name an amount');
    expect(notes).toContain('general, safe options');
    const safe = [
      'Hold your price',
      'Trade: a smaller step, for something back',
      'Ask what matters most to them',
      'Ask what they mean',
    ];
    for (const n of cardNames(container)) expect(safe).toContain(n);
  });

  it('scope cut: asks for the smaller effort (USER DECISION), then prices it with the engine', async () => {
    const { container } = await startFromReader();
    await readReply('Too high. Can you do 40k?');
    await toOptions();
    const card = [...container.querySelectorAll<HTMLElement>('.option-card')].find((c) =>
      c.textContent!.includes('Cut the scope'),
    )!;
    const draftBtn = within(card).getByRole('button', {
      name: 'Draft this reply',
    }) as HTMLButtonElement;
    expect(draftBtn.disabled).toBe(true);
    const effort = within(card).getByLabelText('How many days would the smaller job take?');
    fireEvent.change(effort, { target: { value: '9' } });
    expect(card.textContent).toContain('Make it smaller than the full job');
    fireEvent.change(effort, { target: { value: '6' } });
    expect(card.textContent).toContain('Price for the smaller job');
    expect(draftBtn.disabled).toBe(false);
    fireEvent.click(draftBtn);
    await screen.findByRole('heading', { name: 'Draft your reply' });
    expect(draftBox().value).toContain('₹40,000');
    expect(container.textContent).toContain(OK);
  });
});

describe('S6 draft', () => {
  it('a template draft, editable; the check line only when it passed; copy', async () => {
    const { container } = await startFromReader();
    await readReply('Too high. Can you do 40k?');
    await toOptions();
    fireEvent.click(firstDraftable());
    await screen.findByRole('heading', { name: 'Draft your reply' });
    expect(container.textContent).toContain('Nothing is sent anywhere; you send it yourself.');
    expect(draftBox().value).toContain('₹45,000');
    expect(draftBox().value).not.toContain('₹38,000'); // the floor is never in a draft
    expect(container.textContent).toContain(OK);

    // an invented number: the line goes, the number is listed
    fireEvent.change(draftBox(), { target: { value: `${draftBox().value} Or maybe 42k.` } });
    expect(container.textContent).not.toContain(OK);
    expect(container.querySelector('.draft-fail')!.textContent).toContain('42k');
    // the floor typed in by hand is caught too
    fireEvent.change(draftBox(), { target: { value: 'My lowest is ₹38,000.' } });
    expect(container.textContent).not.toContain(OK);
    fireEvent.change(draftBox(), { target: { value: 'My price stays at ₹45,000.' } });
    expect(container.textContent).toContain(OK);

    // copy: the clipboard gets exactly the draft
    const writeText = vi.fn(async () => {});
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    fireEvent.click(screen.getByRole('button', { name: 'Copy the draft' }));
    await screen.findByText('Copied. Paste it into your message to the client.');
    expect(writeText).toHaveBeenCalledWith('My price stays at ₹45,000.');
  });

  it('language and tone rebuild an untouched draft; an edited draft is kept until rebuilt', async () => {
    await startFromReader();
    await readReply('Too high. Can you do 40k?');
    await toOptions();
    fireEvent.click(firstDraftable());
    await screen.findByRole('heading', { name: 'Draft your reply' });
    const en = draftBox().value;
    fireEvent.click(screen.getByRole('radio', { name: 'Hinglish (Roman script)' }));
    expect(draftBox().value).not.toBe(en);
    expect(draftBox().value).toContain('₹45,000');
    expect(draftBox().value).toMatch(/^[\x20-\x7E₹…]*$/); // Roman script only
    fireEvent.change(draftBox(), { target: { value: 'Mine. ₹45,000.' } });
    fireEvent.click(screen.getByRole('radio', { name: 'Firm' }));
    expect(draftBox().value).toBe('Mine. ₹45,000.');
    fireEvent.click(screen.getByRole('button', { name: 'Rebuild the draft with these choices' }));
    expect(draftBox().value).not.toBe('Mine. ₹45,000.');
    expect(draftBox().value).toContain('₹45,000');
  });

  it('the manual path: write your own reply, checked against the plan’s numbers', async () => {
    const { container } = await startFromReader();
    await readReply('Too high. Can you do 40k?');
    await toOptions();
    fireEvent.click(screen.getByRole('button', { name: 'None of these? Write your own reply' }));
    await screen.findByRole('heading', { name: 'Draft your reply' });
    expect(draftBox().value).toBe('');
    expect(container.textContent).toContain('Write a reply to check its numbers.');
    fireEvent.change(draftBox(), { target: { value: 'I can hold at ₹45,000.' } });
    expect(container.textContent).toContain(OK);
    fireEvent.change(draftBox(), { target: { value: 'I can do ₹41,000.' } });
    expect(container.textContent).not.toContain(OK);
  });
});

describe('S6 input and storage', () => {
  it('the client’s message never reaches the draft or storage; the reply persists; delete-all clears it', async () => {
    const view = await startFromReader();
    await readReply(`${SENTINEL} too high, can you do 40k?`);
    await toOptions();
    fireEvent.click(firstDraftable());
    await screen.findByRole('heading', { name: 'Draft your reply' });
    expect(view.container.textContent).not.toContain(SENTINEL);
    fireEvent.change(draftBox(), { target: { value: 'Edited: my price is ₹45,000.' } });
    await vi.waitFor(async () => {
      const d = (await listDeals())[0];
      expect(d?.reply?.text).toBe('Edited: my price is ₹45,000.');
    });
    const stored = await listDeals();
    expect(json(stored)).not.toContain(SENTINEL);
    expect(json(stored)).not.toContain('too high');
    expect(stored[0]!.reply!.request!.kind).toBe('HOLD');
    expect(Object.keys(stored[0]!.reply!.request!).sort()).toEqual(
      ['condition', 'kind', 'lang', 'move', 'numbers', 'objection', 'tone', 'unit'].sort(),
    );

    // a fresh start: open the deal, the saved draft is there
    cleanup();
    const again = render(<App />);
    fireEvent.click(await screen.findByRole('button', { name: 'Example deal (made up)' }));
    await screen.findByRole('heading', { name: 'Your price ladder' });
    expect(again.container.textContent).toContain('Your saved draft');
    fireEvent.click(screen.getByRole('button', { name: 'Open your draft' }));
    await screen.findByRole('heading', { name: 'Draft your reply' });
    expect(draftBox().value).toBe('Edited: my price is ₹45,000.');
    expect(again.container.textContent).toContain(OK);

    // delete everything
    fireEvent.click(screen.getByRole('button', { name: 'Settings and privacy' }));
    fireEvent.click(screen.getByRole('button', { name: 'Delete everything on this device' }));
    fireEvent.click(screen.getByRole('button', { name: 'Yes, delete everything' }));
    await screen.findByText('Everything on this device was deleted.');
    expect(await listDeals()).toEqual([]);
  });
});
