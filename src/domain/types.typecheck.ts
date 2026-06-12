import type { BabyRecord, RecordDraft } from "./types";

const growthRecord = {
  id: "r1",
  childId: "c1",
  type: "growth",
  occurredAt: "2026-06-12T08:00",
  payload: { heightCm: 72 },
  createdAt: "2026-06-12T08:00",
  updatedAt: "2026-06-12T08:00",
} satisfies BabyRecord<"growth">;

void growthRecord;

const mismatchedRecord: BabyRecord = {
  id: "r2",
  childId: "c1",
  type: "journal",
  occurredAt: "2026-06-12T08:00",
  // @ts-expect-error journal records require JournalPayload.
  payload: { heightCm: 72 },
  createdAt: "2026-06-12T08:00",
  updatedAt: "2026-06-12T08:00",
};

void mismatchedRecord;

const mismatchedDraft: RecordDraft = {
  type: "photo",
  childId: "c1",
  occurredAt: "2026-06-12T08:00",
  // @ts-expect-error photo drafts require PhotoPayload.
  payload: { body: "caption" },
};

void mismatchedDraft;
