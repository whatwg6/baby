import { describe, expect, it } from "vitest";
import type { BabyRecord } from "../domain/types";
import { calculateAgeText, formatDateLabel, groupRecordsByDay, minutesBetween } from "./date";

describe("date utilities", () => {
  it("formats a Chinese age label", () => {
    expect(calculateAgeText("2025-06-12", new Date("2026-08-20T00:00:00"))).toBe("1岁2个月");
  });

  it("returns a deliberate label for a future birthday", () => {
    expect(calculateAgeText("2026-09-01", new Date("2026-08-20T00:00:00"))).toBe("未出生");
  });

  it("keeps leap-day age labels non-negative", () => {
    expect(calculateAgeText("2024-02-29", new Date("2025-02-28T00:00:00"))).toBe("11个月");
  });

  it("returns an explicit label for invalid birthday input", () => {
    expect(calculateAgeText("not-a-date", new Date("2026-08-20T00:00:00"))).toBe("日期无效");
  });

  it("returns an explicit label for impossible calendar dates", () => {
    expect(calculateAgeText("2026-02-31", new Date("2026-08-20T00:00:00"))).toBe("日期无效");
  });

  it("formats a Chinese date label", () => {
    expect(formatDateLabel("2026-06-12T08:30:00.000Z")).toContain("2026");
  });

  it("calculates minute duration", () => {
    expect(minutesBetween("2026-06-12T10:00", "2026-06-12T11:45")).toBe(105);
  });

  it("groups records by local day in descending order", () => {
    const records = [
      {
        id: "1",
        childId: "c1",
        type: "journal",
        occurredAt: "2026-06-11T10:00",
        payload: { body: "a" },
        createdAt: "",
        updatedAt: "",
      },
      {
        id: "2",
        childId: "c1",
        type: "sleep",
        occurredAt: "2026-06-12T09:00",
        payload: { startTime: "", endTime: "" },
        createdAt: "",
        updatedAt: "",
      },
    ] satisfies BabyRecord[];

    expect(groupRecordsByDay(records).map((group) => group.date)).toEqual(["2026-06-12", "2026-06-11"]);
  });

  it("groups local date strings predictably", () => {
    const records = [
      {
        id: "1",
        childId: "c1",
        type: "journal",
        occurredAt: "2026-06-12T23:30",
        payload: { body: "late" },
        createdAt: "",
        updatedAt: "",
      },
      {
        id: "2",
        childId: "c1",
        type: "journal",
        occurredAt: "2026-06-12T00:15",
        payload: { body: "early" },
        createdAt: "",
        updatedAt: "",
      },
    ] satisfies BabyRecord[];

    expect(groupRecordsByDay(records)).toMatchObject([
      {
        date: "2026-06-12",
        records: [{ id: "1" }, { id: "2" }],
      },
    ]);
  });
});
