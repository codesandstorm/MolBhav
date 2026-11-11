import 'fake-indexeddb/auto';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { App } from '../src/App.tsx';

// jsdom has no Worker: the test runs the same rules directly (the browser runs them in the Worker)
vi.mock('../src/analyser.ts', async () => {
  const { analyse } = await import('@molbhav/analyser');
  return {
    analyseMessage: async (text: string, state: { quoteSent: boolean | null }) =>
      analyse(text, state),
  };
});
afterEach(cleanup);

/** The texts below are made-up test messages, not gold. */
const open = async () => {
  const view = render(<App />);
  fireEvent.click(screen.getByRole('button', { name: 'Read a client’s reply' }));
  await screen.findByRole('heading', { name: 'Read your client’s reply' });
  return view;
};
const readMessage = async (text: string) => {
  fireEvent.change(screen.getByLabelText('Paste what your client said'), {
    target: { value: text },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Read it' }));
  return screen.findByRole('heading', { name: 'What the rules read' });
};
const row = (c: HTMLElement, name: string) =>
  c.querySelector<HTMLElement>(`[data-reader="${name}"]`)!;
const CAVEAT = 'read by rules on your device; may be wrong';

describe('S4b reader screen', () => {
  it('every analyser output is an ESTIMATE with its confidence and the caveat', async () => {
    const { container } = await open();
    await readMessage('Too high bhai, budget nahi hai. Can you do 30 hazaar?');
    const est = row(container, 'move').querySelector('[data-label="ESTIMATE"]')!;
    expect(est.textContent).toContain('Names a price or asks for one');
    expect(est.textContent).toMatch(/confidence \d+%/);
    expect(est.textContent).toContain(CAVEAT);
    const obj = row(container, 'objection').querySelector('[data-label="ESTIMATE"]')!;
    expect(obj.textContent).toContain('Budget');
    expect(obj.textContent).toMatch(/confidence \d+%/);
    expect(obj.textContent).toContain(CAVEAT);
    const amount = row(container, 'amount');
    expect(amount.querySelector('[data-label="ESTIMATE"]')!.textContent).toContain(CAVEAT);
    const input = within(amount).getByLabelText('Amount they mention') as HTMLInputElement;
    expect(input.value).toBe('30,000');
    expect(input.closest('[data-label]')?.getAttribute('data-label')).toBe('ESTIMATE');
    // never "AI understands", and no accuracy number
    expect(container.textContent).not.toMatch(/understands|accuracy|F1/i);
  });

  it('invariant: every ESTIMATE on the screen carries the caveat', async () => {
    const { container } = await open();
    for (const [text, quote] of [
      ['Can you do it for 28k?', 'Yes'],
      ['Okay, I can stretch to 38k if you finish by Friday.', 'Not sure'],
      ['Budget 40-45k hai, too high', 'Not yet'],
      ['Kitne din lagenge?', 'Not sure'],
    ] as const) {
      fireEvent.click(screen.getByRole('radio', { name: quote }));
      await readMessage(text);
      const estimates = container.querySelectorAll<HTMLElement>(
        '.reader-result [data-label="ESTIMATE"]',
      );
      expect(estimates.length).toBeGreaterThan(0);
      for (const el of estimates) {
        // an estimated amount sits in an input; its row's status line carries the caveat
        const where = el.querySelector('input') ? el.closest<HTMLElement>('[data-reader]')! : el;
        expect(where.textContent, el.textContent ?? '').toContain(CAVEAT);
      }
    }
  });

  it('the manual picker is always there, and a pick becomes a USER DECISION', async () => {
    const { container } = await open();
    await readMessage('Sounds good, go ahead. Send me the invoice.');
    const move = row(container, 'move');
    expect(within(move).getByRole('group', { name: 'Not right? Pick it yourself' })).toBeTruthy();
    fireEvent.click(within(move).getByRole('radio', { name: 'Pushes back on the price' }));
    expect(move.querySelector('[data-label="USER DECISION"]')!.textContent).toContain(
      'Pushes back on the price',
    );
    fireEvent.change(within(row(container, 'objection')).getByLabelText('Change the reason'), {
      target: { value: 'TIMELINE' },
    });
    expect(
      row(container, 'objection').querySelector('[data-label="USER DECISION"]')!.textContent,
    ).toContain('Timeline');
  });

  it('low confidence asks the user to pick; no evidence says it could not tell', async () => {
    const { container } = await open();
    await readMessage('Fine, we will pay 40k.'); // two moves tie → confidence 0
    expect(
      within(row(container, 'move')).getByRole('group', {
        name: 'Not sure what they mean. Pick one:',
      }),
    ).toBeTruthy();
    await readMessage('asdf qwer');
    expect(
      within(row(container, 'move')).getByRole('group', {
        name: 'Couldn’t tell what they are doing. Pick one:',
      }),
    ).toBeTruthy();
  });

  it('no amount: "Couldn’t find an amount. Type it:"; a typed amount is a USER DECISION', async () => {
    const { container } = await open();
    await readMessage('How many revisions are included?');
    const amount = row(container, 'amount');
    const input = within(amount).getByLabelText(
      'Couldn’t find an amount. Type it:',
    ) as HTMLInputElement;
    expect(input.value).toBe('');
    fireEvent.change(input, { target: { value: '35000' } });
    // the input re-mounts inside its new label chip, so look it up again
    const typed = within(amount).getByLabelText('Couldn’t find an amount. Type it:');
    expect(typed.closest('[data-label]')?.getAttribute('data-label')).toBe('USER DECISION');
    fireEvent.change(typed, { target: { value: '35k' } });
    expect(within(amount).getByText('Use whole rupees')).toBeTruthy();
  });

  it('a range shows both ends; an unclear amount says why', async () => {
    const { container } = await open();
    await readMessage('Budget 40-45k hai.');
    const amount = row(container, 'amount');
    expect((within(amount).getByLabelText('Amount they mention') as HTMLInputElement).value).toBe(
      '40,000',
    );
    expect(
      (within(amount).getByLabelText('Upper end of their range') as HTMLInputElement).value,
    ).toBe('45,000');
    await readMessage('40k or 45k, whichever.');
    expect(row(container, 'amount').textContent).toContain(
      'two different prices: check which one they mean',
    );
  });

  it('ANCHOR vs COUNTER follows the user’s answer about the quote', async () => {
    const { container } = await open();
    fireEvent.click(screen.getByRole('radio', { name: 'Not yet' }));
    await readMessage('Can you do it for 28k?');
    expect(row(container, 'move').textContent).toContain('Their first number: an anchor');
    fireEvent.click(screen.getByRole('radio', { name: 'Yes' }));
    await readMessage('Can you do it for 28k?');
    expect(row(container, 'move').textContent).toContain('A counter to your quote');
  });

  it('an empty box asks for a message and reads nothing', async () => {
    await open();
    fireEvent.click(screen.getByRole('button', { name: 'Read it' }));
    expect(await screen.findByText('Paste a message first')).toBeTruthy();
    expect(screen.queryByRole('heading', { name: 'What the rules read' })).toBeNull();
  });

  it('Delete everything also clears this screen', async () => {
    await open();
    await readMessage('Can you do it for 28k?');
    fireEvent.click(screen.getByRole('button', { name: 'Settings and privacy' }));
    fireEvent.click(
      await screen.findByRole('button', { name: 'Delete everything on this device' }),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Yes, delete everything' }));
    await screen.findByText('Everything on this device was deleted.');
    fireEvent.click(screen.getByRole('button', { name: 'MolBhav' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Read a client’s reply' }));
    expect(
      (screen.getByLabelText('Paste what your client said') as HTMLTextAreaElement).value,
    ).toBe('');
    expect(screen.queryByRole('heading', { name: 'What the rules read' })).toBeNull();
  });

  it('is reachable from the ladder screen and goes back to it', async () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Try an example deal' }));
    await screen.findByRole('heading', { name: 'Your price ladder' });
    expect(screen.getByText('Got a reply from your client? Paste it.')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Read their reply' }));
    await screen.findByRole('heading', { name: 'Read your client’s reply' });
    fireEvent.click(screen.getByRole('button', { name: 'Back' }));
    await screen.findByRole('heading', { name: 'Your price ladder' });
  });
});
