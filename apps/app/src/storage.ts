import { openDB, deleteDB, type IDBPDatabase } from 'idb';
import type { DealForm } from './form.ts';

/** S13: deals live only in IndexedDB on this device. No network code exists in the app. */
const DB = 'molbhav';
const STORE = 'deals';

export interface StoredDeal {
  id: string;
  createdAt: number;
  updatedAt: number;
  form: DealForm;
}

let dbp: Promise<IDBPDatabase> | null = null;
const db = () =>
  (dbp ??= openDB(DB, 1, {
    upgrade(d) {
      d.createObjectStore(STORE, { keyPath: 'id' });
    },
  }));

export const saveDeal = async (deal: StoredDeal): Promise<void> => {
  await (await db()).put(STORE, deal);
};

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
