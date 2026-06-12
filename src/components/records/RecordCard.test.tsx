import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { BabyRecord, RecordDraft } from "../../domain/types";
import { RecordCard } from "./RecordCard";
import { RecordComposer } from "./RecordComposer";

const baseRecord = {
  id: "record-1",
  childId: "child-1",
  occurredAt: "2026-06-12T09:30",
  createdAt: "2026-06-12T09:31:00.000Z",
  updatedAt: "2026-06-12T09:31:00.000Z",
} satisfies Pick<BabyRecord, "id" | "childId" | "occurredAt" | "createdAt" | "updatedAt">;

afterEach(() => {
  cleanup();
});

describe("RecordCard", () => {
  it("renders record metadata, summary, time, and note", () => {
    render(
      <RecordCard
        record={{
          ...baseRecord,
          type: "growth",
          note: "精神很好",
          payload: {
            heightCm: 72,
            weightKg: 8.6,
          },
        }}
      />,
    );

    expect(screen.getByText("身高体重")).toBeInTheDocument();
    expect(screen.getByText("身高 72 cm · 体重 8.6 kg")).toBeInTheDocument();
    expect(screen.getByText("09:30")).toBeInTheDocument();
    expect(screen.getByText("精神很好")).toBeInTheDocument();
  });

  it("renders a fallback instead of crashing when occurredAt is invalid", () => {
    render(
      <RecordCard
        record={{
          ...baseRecord,
          occurredAt: "not-a-date",
          type: "journal",
          payload: {
            body: "今天很开心",
          },
        }}
      />,
    );

    expect(screen.getByText("日期无效")).toBeInTheDocument();
    expect(screen.getByText("今天很开心")).toBeInTheDocument();
  });
});

describe("RecordComposer", () => {
  it("saves a growth draft with numeric measurements", async () => {
    const user = userEvent.setup();
    const handleSave = vi.fn<(draft: RecordDraft) => void>();

    render(<RecordComposer childId="child-1" initialType="growth" onCancel={vi.fn()} onSave={handleSave} />);

    await user.clear(screen.getByLabelText("记录日期"));
    await user.type(screen.getByLabelText("记录日期"), "2026-06-12");
    await user.clear(screen.getByLabelText("记录时间"));
    await user.type(screen.getByLabelText("记录时间"), "09:30");
    await user.type(screen.getByLabelText("身高 cm"), "72");
    await user.type(screen.getByLabelText("体重 kg"), "8.6");
    await user.type(screen.getByLabelText("备注"), "第一次扶站后测量");
    await user.click(screen.getByRole("button", { name: "保存" }));

    expect(handleSave).toHaveBeenCalledWith({
      type: "growth",
      childId: "child-1",
      occurredAt: "2026-06-12T09:30",
      note: "第一次扶站后测量",
      payload: {
        heightCm: 72,
        weightKg: 8.6,
      },
    });
  });

  it("saves a journal draft", async () => {
    const user = userEvent.setup();
    const handleSave = vi.fn<(draft: RecordDraft) => void>();

    render(<RecordComposer childId="child-1" initialType="journal" onCancel={vi.fn()} onSave={handleSave} />);

    await user.clear(screen.getByLabelText("记录日期"));
    await user.type(screen.getByLabelText("记录日期"), "2026-06-12");
    await user.clear(screen.getByLabelText("记录时间"));
    await user.type(screen.getByLabelText("记录时间"), "20:15");
    await user.type(screen.getByLabelText("日记内容"), "今天第一次自己站稳了");
    await user.click(screen.getByRole("button", { name: "保存" }));

    expect(handleSave).toHaveBeenCalledWith({
      type: "journal",
      childId: "child-1",
      occurredAt: "2026-06-12T20:15",
      note: undefined,
      title: "今天第一次自己站稳了",
      payload: {
        body: "今天第一次自己站稳了",
      },
    });
  });

  it("prevents duplicate saves while an async save is pending", async () => {
    const user = userEvent.setup();
    const handleSave = vi.fn<(draft: RecordDraft) => Promise<void>>(() => new Promise(() => undefined));

    render(<RecordComposer childId="child-1" initialType="journal" onCancel={vi.fn()} onSave={handleSave} />);

    await user.type(screen.getByLabelText("日记内容"), "午睡醒来心情很好");
    await user.dblClick(screen.getByRole("button", { name: "保存" }));

    expect(handleSave).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "保存中" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "取消" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "日记" })).toBeDisabled();
  });

  it("shows an accessible local error when sleep end time is before start time", async () => {
    const user = userEvent.setup();
    const handleSave = vi.fn<(draft: RecordDraft) => void>();

    render(<RecordComposer childId="child-1" initialType="sleep" onCancel={vi.fn()} onSave={handleSave} />);

    await user.clear(screen.getByLabelText("入睡日期"));
    await user.type(screen.getByLabelText("入睡日期"), "2026-06-12");
    await user.clear(screen.getByLabelText("入睡时间"));
    await user.type(screen.getByLabelText("入睡时间"), "22:00");
    await user.clear(screen.getByLabelText("醒来日期"));
    await user.type(screen.getByLabelText("醒来日期"), "2026-06-12");
    await user.clear(screen.getByLabelText("醒来时间"));
    await user.type(screen.getByLabelText("醒来时间"), "21:30");
    await user.click(screen.getByRole("button", { name: "保存" }));

    expect(screen.getByRole("alert")).toHaveTextContent("睡眠结束时间不能早于开始时间");
    expect(screen.getByLabelText("醒来时间")).toHaveAccessibleDescription("睡眠结束时间不能早于开始时间");
    expect(handleSave).not.toHaveBeenCalled();
  });
});
