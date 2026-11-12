import { openDB, deleteDB, type IDBPDatabase } from 'idb';
import type { DealForm } from './form.ts';
import type { StoredReply } from './reply.ts';

/**
 * S13: deals live only in IndexedDB on this device. No network code exists in the app.
 * A deal may carry the reply the user is drafting (S6): the chosen option, the choices and the
 * draft text, never the client's message.
 */
const DB = 'molbhav';
const STORE = 'deals';

export interface StoredDeal {
  id: string;
  createdAt: number;
  updatedAt: number;
  form: DealForm;
  reply?: StoredReply;
}

let dbp: Promise<IDBPDatabase> | null = null;
const db = () =>
  (dbp ??= openDB(DB, 1, {
    upgrade(d) {
      d.createObjectStore(STORE, { keyPath: 'id' });
    },
    // another tab (or this one) is deleting everything: let go, so the delete is not blocked
    blocking(_current, _next, event) {
      (event.target as IDBDatabase).close();
      dbp = null;
    },
  }));

export const saveDeal = async (deal: StoredDeal): Promise<void> => {
  await (await db()).put(STORE, deal);
};

export const getDeal = async (id: string): Promise<StoredDeal | undefined> =>
  (await (await db()).get(STORE, id)) as StoredDeal | undefined;

export const listDeals = async (): Promise<StoredDeal[]> => {
  const all = (await (await db()).getAll(STORE)) as StoredDeal[];
  return all.sort((x, y) => y.updatedAt - x.updatedAt);
};

/** Delete everything on this device: closes the connection and deletes the whole database. */
export const deleteEverything = async (): Promise<void> => {
  if (dbp) (await dbp).close();
  dbp = null;
  await deleteDB(DB);
  try {
    localStorage.clear();
    sessionStorage.clear();
  } catch {
    /* storage may be unavailable; nothing else is stored */
  }
};

export const newId = (): string => crypto.randomUUID();
