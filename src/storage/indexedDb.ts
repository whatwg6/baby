/* global DOMException, IDBDatabase, IDBObjectStore, IDBRequest, IDBTransaction, IDBTransactionMode, indexedDB */

export const DEFAULT_DB_NAME = "baby-growth";
export const DB_VERSION = 1;

export const STORE_NAMES = {
  children: "children",
  records: "records",
  media: "media",
} as const;

export type StoreName = (typeof STORE_NAMES)[keyof typeof STORE_NAMES];

export function openBabyDatabase(dbName = DEFAULT_DB_NAME): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName, DB_VERSION);

    request.onupgradeneeded = () => {
      const database = request.result;

      if (!database.objectStoreNames.contains(STORE_NAMES.children)) {
        database.createObjectStore(STORE_NAMES.children, { keyPath: "id" });
      }

      if (!database.objectStoreNames.contains(STORE_NAMES.records)) {
        const recordStore = database.createObjectStore(STORE_NAMES.records, { keyPath: "id" });
        recordStore.createIndex("childId", "childId", { unique: false });
        recordStore.createIndex("type", "type", { unique: false });
        recordStore.createIndex("occurredAt", "occurredAt", { unique: false });
      }

      if (!database.objectStoreNames.contains(STORE_NAMES.media)) {
        database.createObjectStore(STORE_NAMES.media, { keyPath: "id" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export function transactionDone(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
  });
}

function abortReadwriteTransaction(transaction: IDBTransaction, mode: IDBTransactionMode) {
  if (mode !== "readwrite") {
    return;
  }

  try {
    transaction.abort();
  } catch (error) {
    if (error instanceof DOMException && error.name === "InvalidStateError") {
      return;
    }

    throw error;
  }
}

export async function withStore<T>(
  dbName: string,
  storeName: StoreName,
  mode: IDBTransactionMode,
  operation: (store: IDBObjectStore) => Promise<T>,
) {
  const database = await openBabyDatabase(dbName);

  try {
    const transaction = database.transaction(storeName, mode);
    const transactionFinished = transactionDone(transaction);
    const store = transaction.objectStore(storeName);

    try {
      const result = await operation(store);
      await transactionFinished;

      return result;
    } catch (error) {
      abortReadwriteTransaction(transaction, mode);
      await transactionFinished.catch(() => undefined);
      throw error;
    }
  } finally {
    database.close();
  }
}

export async function withStores<T>(
  dbName: string,
  storeNames: StoreName[],
  mode: IDBTransactionMode,
  operation: (stores: Map<StoreName, IDBObjectStore>) => Promise<T>,
) {
  const database = await openBabyDatabase(dbName);

  try {
    const transaction = database.transaction(storeNames, mode);
    const transactionFinished = transactionDone(transaction);
    const stores = new Map<StoreName, IDBObjectStore>(
      storeNames.map((storeName) => [storeName, transaction.objectStore(storeName)]),
    );

    try {
      const result = await operation(stores);
      await transactionFinished;

      return result;
    } catch (error) {
      abortReadwriteTransaction(transaction, mode);
      await transactionFinished.catch(() => undefined);
      throw error;
    }
  } finally {
    database.close();
  }
}
