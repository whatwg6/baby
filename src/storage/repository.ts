/* global crypto */

import type { BabyRecord, Child, MediaAsset, RecordDraft, RecordType } from "../domain/types";
import {
  DEFAULT_DB_NAME,
  requestToPromise,
  STORE_NAMES,
  withStore,
  withStores,
} from "./indexedDb";

type RecordPatch<T extends RecordType = RecordType> = {
  title?: BabyRecord<T>["title"];
  note?: BabyRecord<T>["note"];
  mediaIds?: BabyRecord<T>["mediaIds"];
  occurredAt?: BabyRecord<T>["occurredAt"];
  payload?: BabyRecord<T>["payload"];
};
type MediaDraft = Omit<MediaAsset, "id" | "createdAt">;

export type Repository = {
  ensureDefaultChild(): Promise<Child>;
  updateChild(child: Child): Promise<Child>;
  createRecord<T extends RecordType>(draft: RecordDraft<T>): Promise<BabyRecord<T>>;
  updateRecord<T extends RecordType>(id: string, patch: RecordPatch<T>): Promise<BabyRecord>;
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

function assertUpdatePatchDoesNotChangeIdentity(patch: object) {
  if ("type" in patch) {
    throw new Error("记录类型不可修改");
  }

  if ("id" in patch || "childId" in patch || "createdAt" in patch) {
    throw new Error("记录标识不可修改");
  }
}

function mergeRecordPatch<T extends RecordType>(
  record: BabyRecord<T>,
  patch: RecordPatch<T>,
): BabyRecord<T> {
  return {
    ...record,
    ...patch,
    id: record.id,
    childId: record.childId,
    type: record.type,
    createdAt: record.createdAt,
    updatedAt: nextUpdatedAt(record.updatedAt),
  };
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
        assertUpdatePatchDoesNotChangeIdentity(patch);
        const existingRecord = (await requestToPromise(store.get(id))) as BabyRecord | undefined;

        if (!existingRecord) {
          throw new Error("记录不存在");
        }

        const updatedRecord = mergeRecordPatch(existingRecord, patch);

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
