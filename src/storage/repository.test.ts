/* global crypto, indexedDB */

import { afterEach, describe, expect, it } from "vitest";
import type { RecordDraft } from "../domain/types";
import { requestToPromise, STORE_NAMES, withStore, withStores } from "./indexedDb";
import { createRepository } from "./repository";

const dbNames: string[] = [];

function uniqueDbName() {
  const name = `baby-growth-test-${crypto.randomUUID()}`;
  dbNames.push(name);
  return name;
}

afterEach(async () => {
  await Promise.all(
    dbNames.splice(0).map(
      (name) =>
        new Promise<void>((resolve, reject) => {
          const request = indexedDB.deleteDatabase(name);
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
          request.onblocked = () => resolve();
        }),
    ),
  );
});

describe("createRepository", () => {
  it("creates a default child only once", async () => {
    const repository = createRepository(uniqueDbName());

    const firstChild = await repository.ensureDefaultChild();
    const secondChild = await repository.ensureDefaultChild();

    expect(firstChild).toEqual(secondChild);
    expect(firstChild.name).toBe("宝宝");
    expect(firstChild.id).toEqual(expect.any(String));
  });

  it("creates, lists, and filters records by child and type", async () => {
    const repository = createRepository(uniqueDbName());
    const child = await repository.ensureDefaultChild();

    const olderJournal = await repository.createRecord({
      childId: child.id,
      type: "journal",
      occurredAt: "2026-06-10T08:00:00.000Z",
      payload: { body: "早上的记录" },
    });
    const newerGrowth = await repository.createRecord({
      childId: child.id,
      type: "growth",
      occurredAt: "2026-06-12T08:00:00.000Z",
      payload: { heightCm: 72, weightKg: 8.4 },
    });
    await repository.createRecord({
      childId: "other-child",
      type: "journal",
      occurredAt: "2026-06-13T08:00:00.000Z",
      payload: { body: "不应该出现" },
    });

    const allRecords = await repository.listRecords({ childId: child.id });
    const journalRecords = await repository.listRecords({ childId: child.id, type: "journal" });

    expect(allRecords.map((record) => record.id)).toEqual([newerGrowth.id, olderJournal.id]);
    expect(journalRecords).toEqual([olderJournal]);
  });

  it("updates records and deletes records", async () => {
    const repository = createRepository(uniqueDbName());
    const child = await repository.ensureDefaultChild();
    const sleepDraft = {
      childId: child.id,
      type: "sleep",
      occurredAt: "2026-06-12T12:00:00.000Z",
      payload: {
        startTime: "2026-06-12T12:00:00.000Z",
        endTime: "2026-06-12T13:00:00.000Z",
      },
    } satisfies RecordDraft<"sleep">;
    const record = await repository.createRecord(sleepDraft);

    const updated = await repository.updateRecord(record.id, {
      note: "睡得很好",
      payload: { ...record.payload, quality: "good" },
    });
    await repository.deleteRecord(record.id);

    await expect(repository.updateRecord("missing-record", { note: "nope" })).rejects.toThrow(
      "记录不存在",
    );
    expect(updated.note).toBe("睡得很好");
    expect(updated.type).toBe("sleep");
    if (updated.type === "sleep") {
      expect(updated.payload.quality).toBe("good");
    }
    expect(updated.updatedAt).not.toBe(record.updatedAt);
    await expect(repository.listRecords({ childId: child.id })).resolves.toEqual([]);
  });

  it("preserves a record type when an unsafe patch includes type", async () => {
    const repository = createRepository(uniqueDbName());
    const child = await repository.ensureDefaultChild();
    const record = await repository.createRecord({
      childId: child.id,
      type: "journal",
      occurredAt: "2026-06-12T08:00:00.000Z",
      payload: { body: "不能改类型" },
    });

    await expect(
      repository.updateRecord(record.id, {
        type: "growth",
        payload: { heightCm: 72 },
      } as never),
    ).rejects.toThrow("记录类型不可修改");
    await expect(repository.listRecords({ childId: child.id })).resolves.toEqual([record]);
  });

  it("rolls back queued writes when a single-store transaction operation throws", async () => {
    const dbName = uniqueDbName();
    const timestamp = "2026-06-12T08:00:00.000Z";

    await expect(
      withStore(dbName, STORE_NAMES.children, "readwrite", async (store) => {
        await requestToPromise(
          store.add({
            id: "child-rollback",
            name: "临时宝宝",
            birthday: "2026-06-12",
            createdAt: timestamp,
            updatedAt: timestamp,
          }),
        );
        throw new Error("simulate failure");
      }),
    ).rejects.toThrow("simulate failure");

    const children = await withStore(dbName, STORE_NAMES.children, "readonly", async (store) => {
      return (await requestToPromise(store.getAll())) as unknown[];
    });

    expect(children).toEqual([]);
  });

  it("rolls back queued writes when a multi-store transaction operation throws", async () => {
    const dbName = uniqueDbName();
    const timestamp = "2026-06-12T08:00:00.000Z";

    await expect(
      withStores(
        dbName,
        [STORE_NAMES.children, STORE_NAMES.records],
        "readwrite",
        async (stores) => {
          const childrenStore = stores.get(STORE_NAMES.children);
          const recordsStore = stores.get(STORE_NAMES.records);

          if (!childrenStore || !recordsStore) {
            throw new Error("missing store");
          }

          await requestToPromise(
            childrenStore.add({
              id: "child-multi-rollback",
              name: "临时宝宝",
              birthday: "2026-06-12",
              createdAt: timestamp,
              updatedAt: timestamp,
            }),
          );
          await requestToPromise(
            recordsStore.add({
              id: "record-multi-rollback",
              childId: "child-multi-rollback",
              type: "journal",
              occurredAt: timestamp,
              payload: { body: "不应提交" },
              createdAt: timestamp,
              updatedAt: timestamp,
            }),
          );
          throw new Error("simulate multi-store failure");
        },
      ),
    ).rejects.toThrow("simulate multi-store failure");

    const exported = await createRepository(dbName).exportAll();

    expect(exported.children).toEqual([]);
    expect(exported.records).toEqual([]);
  });

  it("saves media assets and exports a data summary", async () => {
    const repository = createRepository(uniqueDbName());
    const child = await repository.ensureDefaultChild();
    const media = await repository.saveMedia({
      childId: child.id,
      kind: "image",
      blob: new Blob(["avatar"], { type: "image/plain" }),
    });
    await repository.createRecord({
      childId: child.id,
      type: "photo",
      occurredAt: "2026-06-12T08:00:00.000Z",
      mediaIds: [media.id],
      payload: { mediaId: media.id, caption: "第一张照片" },
    });

    const storedMedia = await repository.getMedia(media.id);
    const exported = await repository.exportAll();

    expect(storedMedia).toMatchObject({
      id: media.id,
      childId: child.id,
      kind: "image",
      createdAt: media.createdAt,
    });
    expect(exported.children).toEqual([child]);
    expect(exported.records).toHaveLength(1);
    expect(exported.mediaCount).toBe(1);
    expect(exported.exportedAt).toEqual(expect.any(String));
  });
});
