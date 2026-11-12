import 'fake-indexeddb/auto';
import { describe, expect, it } from 'vitest';
import { deleteEverything, listDeals, saveDeal, type StoredDeal } from '../src/storage.ts';
import { emptyForm } from '../src/form.ts';

const deal: StoredDeal = { id: 'd1', createdAt: 1, updatedAt: 1, form: emptyForm };

describe('storage: delete everything is never blocked', () => {
  it('another tab deleting the database is not blocked by this tab’s open connection', async () => {
    await saveDeal(deal); // this tab now holds an open connection
    const outcome = await new Promise<string>((resolve) => {
      const req = indexedDB.deleteDatabase('molbhav'); // as another tab's delete-all does
      req.onsuccess = () => resolve('deleted');
      setTimeout(() => resolve('still blocked after 2 s'), 2000);
    });
    expect(outcome).toBe('deleted');
    expect(await listDeals()).toEqual([]); // reopens cleanly, empty
  });

  it('delete everything removes saved deals', async () => {
    await saveDeal(deal);
    await deleteEverything();
    expect(await listDeals()).toEqual([]);
  });
});
