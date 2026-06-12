import { describe, expect, it } from "vitest";
import type { BabyRecord } from "../domain/types";
import { calculateAgeText, formatDateLabel, groupRecordsByDay, minutesBetween } from "./date";

describe("date utilities", () => {
  it("formats a Chinese age label", () => {
    expect(calculateAgeText("2025-06-12", new Date("2026-08-20T00:00:00"))).toBe("1岁2个月");
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
});
