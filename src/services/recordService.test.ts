import { describe, expect, it } from "vitest";
import type { BabyRecord, RecordDraft } from "../domain/types";
import { buildGrowthSeries, buildSleepSummary, summarizeRecord, validateDraft } from "./recordService";

const timestamp = "2026-06-12T08:00:00.000Z";

function record<T extends BabyRecord["type"]>(
  type: T,
  payload: BabyRecord<T>["payload"],
  overrides: Partial<Omit<BabyRecord<T>, "type" | "payload">> = {},
): BabyRecord<T> {
  const babyRecord = {
    id: `${type}-record`,
    childId: "child-1",
    type,
    occurredAt: timestamp,
    payload,
    createdAt: timestamp,
    updatedAt: timestamp,
    ...overrides,
  };

  return babyRecord as BabyRecord<T>;
}

describe("validateDraft", () => {
  it("returns Chinese validation errors for missing common and type-specific fields", () => {
    const draft = {
      type: "journal",
      childId: "",
      occurredAt: "",
      payload: { body: "" },
    } satisfies RecordDraft<"journal">;

    expect(validateDraft(draft)).toEqual(["请选择宝宝", "请选择记录时间", "请输入日记内容"]);
  });

  it("requires at least one growth measurement", () => {
    const draft = {
      type: "growth",
      childId: "child-1",
      occurredAt: timestamp,
      payload: {},
    } satisfies RecordDraft<"growth">;

    expect(validateDraft(draft)).toEqual(["请至少填写身高、体重或头围中的一项"]);
  });

  it("rejects sleep drafts whose end time is before the start time", () => {
    const draft = {
      type: "sleep",
      childId: "child-1",
      occurredAt: timestamp,
      payload: {
        startTime: "2026-06-12T10:00:00.000Z",
        endTime: "2026-06-12T09:30:00.000Z",
      },
    } satisfies RecordDraft<"sleep">;

    expect(validateDraft(draft)).toEqual(["睡眠结束时间不能早于开始时间"]);
  });

  it("validates required fields for photo, vaccine, and milestone drafts", () => {
    expect(
      validateDraft({
        type: "photo",
        childId: "child-1",
        occurredAt: timestamp,
        payload: { mediaId: "" },
      }),
    ).toEqual(["请添加照片"]);
    expect(
      validateDraft({
        type: "vaccine",
        childId: "child-1",
        occurredAt: timestamp,
        payload: { vaccineName: "" },
      }),
    ).toEqual(["请输入疫苗名称"]);
    expect(
      validateDraft({
        type: "milestone",
        childId: "child-1",
        occurredAt: timestamp,
        payload: { category: "", description: "" },
      }),
    ).toEqual(["请选择里程碑分类", "请输入里程碑描述"]);
  });
});

describe("summarizeRecord", () => {
  it("returns compact Chinese-friendly summaries for each record type", () => {
    expect(summarizeRecord(record("journal", { body: "今天第一次自己翻身，很开心。" }))).toBe(
      "今天第一次自己翻身，很开心。",
    );
    expect(summarizeRecord(record("photo", { mediaId: "media-1", caption: "公园晒太阳" }))).toBe(
      "照片：公园晒太阳",
    );
    expect(
      summarizeRecord(record("growth", { heightCm: 72, weightKg: 8.4, headCircumferenceCm: 43 })),
    ).toBe("身高 72 cm · 体重 8.4 kg · 头围 43 cm");
    expect(
      summarizeRecord(
        record("sleep", {
          startTime: "2026-06-12T12:00:00.000Z",
          endTime: "2026-06-12T13:30:00.000Z",
        }),
      ),
    ).toBe("睡眠 90 分钟");
    expect(summarizeRecord(record("vaccine", { vaccineName: "乙肝疫苗", dose: "第2剂" }))).toBe(
      "乙肝疫苗 · 第2剂",
    );
    expect(summarizeRecord(record("milestone", { category: "大动作", description: "会坐了" }))).toBe(
      "大动作：会坐了",
    );
  });
});

describe("buildGrowthSeries", () => {
  it("returns growth points sorted ascending by occurrence date", () => {
    const records = [
      record("growth", { weightKg: 8.4 }, { occurredAt: "2026-06-12T08:00:00.000Z" }),
      record(
        "journal",
        { body: "不是成长数据" },
        { id: "journal-1", occurredAt: "2026-06-11T08:00:00.000Z" },
      ),
      record(
        "growth",
        { heightCm: 70, headCircumferenceCm: 42.5 },
        { id: "growth-older", occurredAt: "2026-06-10T08:00:00.000Z" },
      ),
    ];

    expect(buildGrowthSeries(records)).toEqual([
      {
        date: "2026-06-10",
        heightCm: 70,
        headCircumferenceCm: 42.5,
        weightKg: undefined,
      },
      {
        date: "2026-06-12",
        heightCm: undefined,
        headCircumferenceCm: undefined,
        weightKg: 8.4,
      },
    ]);
  });
});

describe("buildSleepSummary", () => {
  it("returns count, total minutes, and average minutes from sleep records", () => {
    const records = [
      record("sleep", {
        startTime: "2026-06-12T12:00:00.000Z",
        endTime: "2026-06-12T13:30:00.000Z",
      }),
      record(
        "sleep",
        {
          startTime: "2026-06-12T20:00:00.000Z",
          endTime: "2026-06-12T22:00:00.000Z",
        },
        { id: "sleep-2" },
      ),
      record("photo", { mediaId: "media-1" }, { id: "photo-1" }),
    ];

    expect(buildSleepSummary(records)).toEqual({
      count: 2,
      totalMinutes: 210,
      averageMinutes: 105,
    });
  });
});
