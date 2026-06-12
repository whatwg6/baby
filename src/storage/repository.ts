/* global IDBObjectStore, IDBTransactionMode, crypto */

import type { BabyRecord, Child, MediaAsset, RecordDraft, RecordType } from "../domain/types";
import {
  DEFAULT_DB_NAME,
  openBabyDatabase,
  requestToPromise,
  STORE_NAMES,
  transactionDone,
  type StoreName,
} from "./indexedDb";

type RecordPatch = Partial<Omit<BabyRecord, "id" | "createdAt">>;
type MediaDraft = Omit<MediaAsset, "id" | "createdAt">;

export type Repository = {
  ensureDefaultChild(): Promise<Child>;
  updateChild(child: Child): Promise<Child>;
  createRecord<T extends RecordType>(draft: RecordDraft<T>): Promise<BabyRecord<T>>;
  updateRecord(id: string, patch: RecordPatch): Promise<BabyRecord>;
  deleteRecord(id: string): Promise<void>;
  listRecords(options: { childId: string; type?: RecordType }): Promise<BabyRecord[]>;
  saveMedia(asset: MediaDraft): Promise<MediaAsset>;
  getMedia(id: string): Promise<MediaAsset | undefined>;
  exportAll(): Promise<{
    exportedAt: string;
    children: Child[];
    records: BabyRecord[];
    mediaCount: number;
  }>;
};

function createId() {
  return crypto.randomUUID();
}

function nowIso() {
  return new Date().toISOString();
}

function nextUpdatedAt(previous: string) {
  const now = new Date();
  const previousTime = Date.parse(previous);

  if (Number.isFinite(previousTime) && now.getTime() <= previousTime) {
    return new Date(previousTime + 1).toISOString();
  }

  return now.toISOString();
}

async function withStore<T>(
  dbName: string,
  storeName: StoreName,
  mode: IDBTransactionMode,
  operation: (store: IDBObjectStore) => Promise<T>,
) {
  const database = await openBabyDatabase(dbName);

  try {
    const transaction = database.transaction(storeName, mode);
    const store = transaction.objectStore(storeName);
    const result = await operation(store);
    await transactionDone(transaction);

    return result;
  } finally {
    database.close();
  }
}

async function withStores<T>(
  dbName: string,
  storeNames: StoreName[],
  mode: IDBTransactionMode,
  operation: (stores: Map<StoreName, IDBObjectStore>) => Promise<T>,
) {
  const database = await openBabyDatabase(dbName);

  try {
    const transaction = database.transaction(storeNames, mode);
    const stores = new Map<StoreName, IDBObjectStore>(
      storeNames.map((storeName) => [storeName, transaction.objectStore(storeName)]),
    );
    const result = await operation(stores);
    await transactionDone(transaction);

    return result;
  } finally {
    database.close();
  }
}

export function createRepository(dbName = DEFAULT_DB_NAME): Repository {
  return {
    async ensureDefaultChild() {
      return withStore(dbName, STORE_NAMES.children, "readwrite", async (store) => {
        const children = (await requestToPromise(store.getAll())) as Child[];
        const existingChild = children.sort((left, right) =>
          left.createdAt.localeCompare(right.createdAt),
        )[0];

        if (existingChild) {
          return existingChild;
        }

        const timestamp = nowIso();
        const child: Child = {
          id: createId(),
          name: "宝宝",
          birthday: timestamp.slice(0, 10),
          createdAt: timestamp,
          updatedAt: timestamp,
        };

        await requestToPromise(store.add(child));

        return child;
      });
    },

    async updateChild(child) {
      const updatedChild: Child = {
        ...child,
        updatedAt: nextUpdatedAt(child.updatedAt),
      };

      await withStore(dbName, STORE_NAMES.children, "readwrite", async (store) => {
        await requestToPromise(store.put(updatedChild));
      });

      return updatedChild;
    },

    async createRecord(draft) {
      const timestamp = nowIso();
      const record = {
        ...draft,
        id: createId(),
        createdAt: timestamp,
        updatedAt: timestamp,
      } as BabyRecord<typeof draft.type>;

      await withStore(dbName, STORE_NAMES.records, "readwrite", async (store) => {
        await requestToPromise(store.add(record));
      });

      return record;
    },

    async updateRecord(id, patch) {
      return withStore(dbName, STORE_NAMES.records, "readwrite", async (store) => {
        const existingRecord = (await requestToPromise(store.get(id))) as BabyRecord | undefined;

        if (!existingRecord) {
          throw new Error("记录不存在");
        }

        const updatedRecord: BabyRecord = {
          ...existingRecord,
          ...patch,
          id: existingRecord.id,
          createdAt: existingRecord.createdAt,
          updatedAt: nextUpdatedAt(existingRecord.updatedAt),
        } as BabyRecord;

        await requestToPromise(store.put(updatedRecord));

        return updatedRecord;
      });
    },

    async deleteRecord(id) {
      await withStore(dbName, STORE_NAMES.records, "readwrite", async (store) => {
        await requestToPromise(store.delete(id));
      });
    },

    async listRecords({ childId, type }) {
      return withStore(dbName, STORE_NAMES.records, "readonly", async (store) => {
        const records = (await requestToPromise(store.index("childId").getAll(childId))) as BabyRecord[];

        return records
          .filter((record) => (type ? record.type === type : true))
          .sort((left, right) => right.occurredAt.localeCompare(left.occurredAt));
      });
    },

    async saveMedia(asset) {
      const mediaAsset: MediaAsset = {
        ...asset,
        id: createId(),
        createdAt: nowIso(),
      };

      await withStore(dbName, STORE_NAMES.media, "readwrite", async (store) => {
        await requestToPromise(store.add(mediaAsset));
      });

      return mediaAsset;
    },

    async getMedia(id) {
      return withStore(dbName, STORE_NAMES.media, "readonly", async (store) => {
        return (await requestToPromise(store.get(id))) as MediaAsset | undefined;
      });
    },

    async exportAll() {
      return withStores(
        dbName,
        [STORE_NAMES.children, STORE_NAMES.records, STORE_NAMES.media],
        "readonly",
        async (stores) => {
          const childrenStore = stores.get(STORE_NAMES.children);
          const recordsStore = stores.get(STORE_NAMES.records);
          const mediaStore = stores.get(STORE_NAMES.media);

          if (!childrenStore || !recordsStore || !mediaStore) {
            throw new Error("存储初始化失败");
          }

          const [children, records, mediaCount] = await Promise.all([
            requestToPromise(childrenStore.getAll()) as Promise<Child[]>,
            requestToPromise(recordsStore.getAll()) as Promise<BabyRecord[]>,
            requestToPromise(mediaStore.count()),
          ]);

          return {
            exportedAt: nowIso(),
            children,
            records: records.sort((left, right) => right.occurredAt.localeCompare(left.occurredAt)),
            mediaCount,
          };
        },
      );
    },
  };
}
