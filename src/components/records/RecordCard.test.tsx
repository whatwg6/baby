import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
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
});
