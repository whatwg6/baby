import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { recordMeta, recordTypeOrder } from "../domain/recordMeta";
import type { BabyRecord } from "../domain/types";
import { HomePage } from "./HomePage";
import { TimelinePage } from "./TimelinePage";

const records = [
  {
    id: "journal-1",
    childId: "child-1",
    type: "journal",
    occurredAt: "2026-06-12T10:00",
    payload: { body: "第一次叫妈妈" },
    createdAt: "",
    updatedAt: "",
  },
  {
    id: "growth-1",
    childId: "child-1",
    type: "growth",
    occurredAt: "2026-06-11T09:00",
    payload: { heightCm: 72, weightKg: 8.5 },
    createdAt: "",
    updatedAt: "",
  },
] satisfies BabyRecord[];

afterEach(() => {
  cleanup();
});

describe("HomePage", () => {
  it("shows quick actions and recent records", async () => {
    const user = userEvent.setup();
    const onStartRecord = vi.fn();

    render(<HomePage records={records} onStartRecord={onStartRecord} />);

    expect(screen.getByRole("heading", { name: "今日记录" })).toBeInTheDocument();
    for (const type of recordTypeOrder) {
      expect(screen.getByRole("button", { name: recordMeta[type].actionLabel })).toBeInTheDocument();
    }
    expect(screen.getByText("第一次叫妈妈")).toBeInTheDocument();
    expect(screen.getByText("身高 72 cm · 体重 8.5 kg")).toBeInTheDocument();
    expect(screen.getAllByText("最新身高体重")[0]).toBeInTheDocument();
    expect(screen.getAllByText("睡眠概览")[0]).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: recordMeta.sleep.actionLabel }));

    expect(onStartRecord).toHaveBeenCalledWith("sleep");
  });
});

describe("TimelinePage", () => {
  it("groups records by date and renders filter controls", async () => {
    const user = userEvent.setup();
    const onFilterChange = vi.fn();

    render(<TimelinePage records={records} filter="all" onFilterChange={onFilterChange} />);

    expect(screen.getByRole("heading", { name: "时间线" })).toBeInTheDocument();
    expect(screen.getByText("2026年6月12日周五")).toBeInTheDocument();
    expect(screen.getByText("2026年6月11日周四")).toBeInTheDocument();
    expect(screen.getByText("第一次叫妈妈")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "身高体重" }));

    expect(onFilterChange).toHaveBeenCalledWith("growth");
  });

  it("skips invalid record dates instead of crashing", () => {
    render(
      <TimelinePage
        records={[
          ...records,
          {
            id: "bad-date",
            childId: "child-1",
            type: "journal",
            occurredAt: "2026-02-31T10:00",
            payload: { body: "坏日期记录" },
            createdAt: "",
            updatedAt: "",
          },
        ]}
        filter="all"
        onFilterChange={vi.fn()}
      />,
    );

    expect(screen.getByText("有 1 条记录日期无效，暂未显示。")).toBeInTheDocument();
    expect(screen.queryByText("坏日期记录")).not.toBeInTheDocument();
  });
});
