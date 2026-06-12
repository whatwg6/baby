import { describe, expect, it } from "vitest";
import type { BabyRecord, RecordDraft } from "../domain/types";
import { buildGrowthSeries, buildSleepSummary, summarizeRecord, validateDraft } from "./recordService";

const timestamp = "2026-06-12T08:00:00.000Z";

const baseRecord = {
  childId: "child-1",
  occurredAt: timestamp,
  createdAt: timestamp,
  updatedAt: timestamp,
};

function journalRecord(
  payload: BabyRecord<"journal">["payload"],
  overrides: Partial<Omit<BabyRecord<"journal">, "type" | "payload">> = {},
): BabyRecord<"journal"> {
  return {
    ...baseRecord,
    id: "journal-record",
    type: "journal",
    payload,
    ...overrides,
  } satisfies BabyRecord<"journal">;
}

function photoRecord(
  payload: BabyRecord<"photo">["payload"],
  overrides: Partial<Omit<BabyRecord<"photo">, "type" | "payload">> = {},
): BabyRecord<"photo"> {
  return {
    ...baseRecord,
    id: "photo-record",
    type: "photo",
    payload,
    ...overrides,
  } satisfies BabyRecord<"photo">;
}

function growthRecord(
  payload: BabyRecord<"growth">["payload"],
  overrides: Partial<Omit<BabyRecord<"growth">, "type" | "payload">> = {},
): BabyRecord<"growth"> {
  return {
    ...baseRecord,
    id: "growth-record",
    type: "growth",
    payload,
    ...overrides,
  } satisfies BabyRecord<"growth">;
}

function sleepRecord(
  payload: BabyRecord<"sleep">["payload"],
  overrides: Partial<Omit<BabyRecord<"sleep">, "type" | "payload">> = {},
): BabyRecord<"sleep"> {
  return {
    ...baseRecord,
    id: "sleep-record",
    type: "sleep",
    payload,
    ...overrides,
  } satisfies BabyRecord<"sleep">;
}

function vaccineRecord(
  payload: BabyRecord<"vaccine">["payload"],
  overrides: Partial<Omit<BabyRecord<"vaccine">, "type" | "payload">> = {},
): BabyRecord<"vaccine"> {
  return {
    ...baseRecord,
    id: "vaccine-record",
    type: "vaccine",
    payload,
    ...overrides,
  } satisfies BabyRecord<"vaccine">;
}

function milestoneRecord(
  payload: BabyRecord<"milestone">["payload"],
  overrides: Partial<Omit<BabyRecord<"milestone">, "type" | "payload">> = {},
): BabyRecord<"milestone"> {
  return {
    ...baseRecord,
    id: "milestone-record",
    type: "milestone",
    payload,
    ...overrides,
  } satisfies BabyRecord<"milestone">;
}

function sleepDraft(
  payload: RecordDraft<"sleep">["payload"],
  overrides: Partial<Omit<RecordDraft<"sleep">, "type" | "payload">> = {},
): RecordDraft<"sleep"> {
  return {
    childId: "child-1",
    type: "sleep",
    occurredAt: timestamp,
    payload,
    ...overrides,
  } satisfies RecordDraft<"sleep">;
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

  it("accepts zero-valued growth measurements as present", () => {
    const draft = {
      type: "growth",
      childId: "child-1",
      occurredAt: timestamp,
      payload: { heightCm: 0 },
    } satisfies RecordDraft<"growth">;

    expect(validateDraft(draft)).toEqual([]);
  });

  it("returns Chinese validation errors for invalid sleep timestamps", () => {
    expect(
      validateDraft(
        sleepDraft({
          startTime: "not-a-date",
          endTime: "2026-06-12T09:30:00.000Z",
        }),
      ),
    ).toEqual(["睡眠开始时间格式不正确"]);
    expect(
      validateDraft(
        sleepDraft({
          startTime: "2026-06-12T09:30:00.000Z",
          endTime: "also-not-a-date",
        }),
      ),
    ).toEqual(["睡眠结束时间格式不正确"]);
    expect(
      validateDraft(
        sleepDraft({
          startTime: "bad-start",
          endTime: "bad-end",
        }),
      ),
    ).toEqual(["睡眠开始时间格式不正确", "睡眠结束时间格式不正确"]);
  });

  it("rejects impossible local sleep calendar dates and accepts valid leap days", () => {
    expect(
      validateDraft(
        sleepDraft({
          startTime: "2026-02-31T09:00",
          endTime: "2026-03-01T10:00",
        }),
      ),
    ).toEqual(["睡眠开始时间格式不正确"]);
    expect(
      validateDraft(
        sleepDraft({
          startTime: "2024-02-29T09:00",
          endTime: "2024-02-29T10:00",
        }),
      ),
    ).toEqual([]);
  });

  it("rejects sleep drafts whose end time is before the start time", () => {
    const draft = sleepDraft({
      startTime: "2026-06-12T10:00:00.000Z",
      endTime: "2026-06-12T09:30:00.000Z",
    });

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
    expect(summarizeRecord(journalRecord({ body: "今天第一次自己翻身，很开心。" }))).toBe(
      "今天第一次自己翻身，很开心。",
    );
    expect(summarizeRecord(photoRecord({ mediaId: "media-1", caption: "公园晒太阳" }))).toBe(
      "照片：公园晒太阳",
    );
    expect(
      summarizeRecord(growthRecord({ heightCm: 72, weightKg: 8.4, headCircumferenceCm: 43 })),
    ).toBe("身高 72 cm · 体重 8.4 kg · 头围 43 cm");
    expect(
      summarizeRecord(
        sleepRecord({
          startTime: "2026-06-12T12:00:00.000Z",
          endTime: "2026-06-12T13:30:00.000Z",
        }),
      ),
    ).toBe("睡眠 90 分钟");
    expect(summarizeRecord(vaccineRecord({ vaccineName: "乙肝疫苗", dose: "第2剂" }))).toBe(
      "乙肝疫苗 · 第2剂",
    );
    expect(summarizeRecord(milestoneRecord({ category: "大动作", description: "会坐了" }))).toBe(
      "大动作：会坐了",
    );
  });
});

describe("buildGrowthSeries", () => {
  it("returns growth points sorted ascending by occurrence date", () => {
    const records = [
      growthRecord({ weightKg: 8.4 }, { occurredAt: "2026-06-12T08:00:00.000Z" }),
      journalRecord({ body: "不是成长数据" }, { id: "journal-1", occurredAt: "2026-06-11T08:00:00.000Z" }),
      growthRecord(
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

  it("does not mutate input and normalizes displayed dates through local day keys", () => {
    const records = [
      growthRecord({ weightKg: 8.4 }, { id: "later", occurredAt: "2026-06-12T23:30:00-02:00" }),
      growthRecord({ heightCm: 70 }, { id: "invalid", occurredAt: "not-a-date" }),
      growthRecord({ heightCm: 69 }, { id: "earlier", occurredAt: "2026-06-12T08:00:00.000Z" }),
    ];
    const originalOrder = records.map((record) => record.id);

    expect(buildGrowthSeries(records)).toEqual([
      {
        date: "2026-06-12",
        heightCm: 69,
        headCircumferenceCm: undefined,
        weightKg: undefined,
      },
      {
        date: "2026-06-13",
        heightCm: undefined,
        headCircumferenceCm: undefined,
        weightKg: 8.4,
      },
    ]);
    expect(records.map((record) => record.id)).toEqual(originalOrder);
  });
});

describe("buildSleepSummary", () => {
  it("returns count, total minutes, and average minutes from sleep records", () => {
    const records = [
      sleepRecord({
        startTime: "2026-06-12T12:00:00.000Z",
        endTime: "2026-06-12T13:30:00.000Z",
      }),
      sleepRecord(
        {
          startTime: "2026-06-12T20:00:00.000Z",
          endTime: "2026-06-12T22:00:00.000Z",
        },
        { id: "sleep-2" },
      ),
      photoRecord({ mediaId: "media-1" }, { id: "photo-1" }),
    ];

    expect(buildSleepSummary(records)).toEqual({
      count: 2,
      totalMinutes: 210,
      averageMinutes: 105,
    });
  });

  it("returns zero values when there are no sleep records", () => {
    expect(buildSleepSummary([photoRecord({ mediaId: "media-1" })])).toEqual({
      count: 0,
      totalMinutes: 0,
      averageMinutes: 0,
    });
  });

  it("skips sleep records with invalid timestamps", () => {
    const records = [
      sleepRecord(
        {
          startTime: "not-a-date",
          endTime: "2026-06-12T13:30:00.000Z",
        },
        { id: "sleep-invalid" },
      ),
      sleepRecord(
        {
          startTime: "2026-06-12T20:00:00.000Z",
          endTime: "2026-06-12T22:00:00.000Z",
        },
        { id: "sleep-valid" },
      ),
    ];

    expect(buildSleepSummary(records)).toEqual({
      count: 1,
      totalMinutes: 120,
      averageMinutes: 120,
    });
  });
});
