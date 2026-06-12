import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { BabyRecord, Child, RecordDraft, RecordType } from "../domain/types";
import type { Repository } from "../storage/repository";
import { useBabyApp } from "./useBabyApp";

const timestamp = "2026-06-12T08:00:00.000Z";

type ExportData = Awaited<ReturnType<Repository["exportAll"]>>;

function defaultChild(overrides: Partial<Child> = {}): Child {
  return {
    id: "child-1",
    name: "宝宝",
    birthday: "2026-01-01",
    createdAt: timestamp,
    updatedAt: timestamp,
    ...overrides,
  };
}

function createTestRepository(initialChild = defaultChild()): Repository {
  let child = initialChild;
  let records: BabyRecord[] = [];
  let recordNumber = 0;

  return {
    async ensureDefaultChild() {
      return child;
    },
    async updateChild(updatedChild) {
      child = {
        ...updatedChild,
        updatedAt: "2026-06-12T09:00:00.000Z",
      };

      return child;
    },
    async createRecord(draft) {
      recordNumber += 1;
      const record = {
        ...draft,
        id: `record-${recordNumber}`,
        createdAt: timestamp,
        updatedAt: timestamp,
      } as BabyRecord<typeof draft.type>;

      records = [record, ...records].sort((left, right) =>
        right.occurredAt.localeCompare(left.occurredAt),
      );

      return record;
    },
    async updateRecord() {
      throw new Error("not implemented in hook tests");
    },
    async deleteRecord() {
      throw new Error("not implemented in hook tests");
    },
    async listRecords({ childId, type }) {
      return records.filter(
        (record) => record.childId === childId && (type ? record.type === type : true),
      );
    },
    async saveMedia() {
      throw new Error("not implemented in hook tests");
    },
    async getMedia() {
      return undefined;
    },
    async exportAll(): Promise<ExportData> {
      return {
        exportedAt: timestamp,
        children: [child],
        records,
        mediaCount: 0,
      };
    },
  };
}

function journalDraft(overrides: Partial<RecordDraft<"journal">> = {}): RecordDraft<"journal"> {
  return {
    childId: "child-1",
    type: "journal",
    occurredAt: timestamp,
    payload: { body: "今天第一次自己翻身。" },
    ...overrides,
  };
}

describe("useBabyApp", () => {
  it("loads a default child on mount", async () => {
    const repository = createTestRepository(defaultChild({ name: "小满" }));
    const { result } = renderHook(() => useBabyApp({ repository }));

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.child?.name).toBe("小满");
    expect(result.current.records).toEqual([]);
    expect(result.current.activeView).toBe("home");
    expect(result.current.filter).toBe("all");
  });

  it("can create a valid record and update visible records", async () => {
    const repository = createTestRepository();
    const { result } = renderHook(() => useBabyApp({ repository }));
    await waitFor(() => expect(result.current.child).not.toBeNull());

    let createdRecord: BabyRecord | null = null;
    await act(async () => {
      createdRecord = await result.current.createRecord(journalDraft());
    });

    expect(createdRecord).toMatchObject({
      id: "record-1",
      type: "journal",
      payload: { body: "今天第一次自己翻身。" },
    });
    expect(result.current.error).toBeNull();
    expect(result.current.visibleRecords).toHaveLength(1);
    expect(result.current.visibleRecords[0].id).toBe("record-1");
  });

  it("sets the first Chinese validation error and does not add an invalid record", async () => {
    const repository = createTestRepository();
    const { result } = renderHook(() => useBabyApp({ repository }));
    await waitFor(() => expect(result.current.child).not.toBeNull());

    let createdRecord: BabyRecord | null = null;
    await act(async () => {
      createdRecord = await result.current.createRecord(journalDraft({ childId: "", occurredAt: "" }));
    });

    expect(createdRecord).toBeNull();
    expect(result.current.error).toBe("请选择宝宝");
    expect(result.current.records).toEqual([]);
    expect(result.current.visibleRecords).toEqual([]);
  });

  it("limits visible records by the selected filter", async () => {
    const repository = createTestRepository();
    const { result } = renderHook(() => useBabyApp({ repository }));
    await waitFor(() => expect(result.current.child).not.toBeNull());

    await act(async () => {
      await result.current.createRecord(journalDraft());
      await result.current.createRecord({
        childId: "child-1",
        type: "growth",
        occurredAt: "2026-06-12T09:00:00.000Z",
        payload: { heightCm: 72 },
      });
      result.current.setFilter("growth");
    });

    expect(result.current.records).toHaveLength(2);
    expect(result.current.visibleRecords.map((record) => record.type)).toEqual(["growth"]);
  });

  it("updates child state", async () => {
    const repository = createTestRepository();
    const { result } = renderHook(() => useBabyApp({ repository }));
    await waitFor(() => expect(result.current.child).not.toBeNull());

    await act(async () => {
      await result.current.updateChild({
        ...result.current.child!,
        name: "安安",
        birthday: "2026-02-03",
      });
    });

    expect(result.current.child).toMatchObject({
      name: "安安",
      birthday: "2026-02-03",
      updatedAt: "2026-06-12T09:00:00.000Z",
    });
  });

  it("returns formatted export JSON containing children and records", async () => {
    const repository = createTestRepository();
    const { result } = renderHook(() => useBabyApp({ repository }));
    await waitFor(() => expect(result.current.child).not.toBeNull());

    await act(async () => {
      await result.current.createRecord(journalDraft());
    });

    const exportedJson = await result.current.exportJson();
    const exportedData = JSON.parse(exportedJson) as ExportData;

    expect(exportedJson).toContain('\n  "children"');
    expect(exportedData.children).toHaveLength(1);
    expect(exportedData.records).toHaveLength(1);
  });

  it("exposes setters for the active view and filter", async () => {
    const repository = createTestRepository();
    const { result } = renderHook(() => useBabyApp({ repository }));
    await waitFor(() => expect(result.current.child).not.toBeNull());

    act(() => {
      result.current.setActiveView("timeline");
      result.current.setFilter("sleep" satisfies RecordType);
    });

    expect(result.current.activeView).toBe("timeline");
    expect(result.current.filter).toBe("sleep");
  });
});
