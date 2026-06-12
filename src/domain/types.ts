export type RecordType = "journal" | "photo" | "growth" | "vaccine" | "sleep" | "milestone";

export type ViewKey = "home" | "timeline" | "data" | "profile";

export type Child = {
  id: string;
  name: string;
  birthday: string;
  avatarUrl?: string;
  sex?: "female" | "male" | "unspecified";
  createdAt: string;
  updatedAt: string;
};

export type JournalPayload = {
  body: string;
};

export type PhotoPayload = {
  caption?: string;
  mediaId: string;
};

export type GrowthPayload = {
  heightCm?: number;
  weightKg?: number;
  headCircumferenceCm?: number;
};

export type SleepPayload = {
  startTime: string;
  endTime: string;
  quality?: "good" | "normal" | "restless";
  note?: string;
};

export type VaccinePayload = {
  vaccineName: string;
  dose?: string;
  scheduledDate?: string;
  completedDate?: string;
  location?: string;
};

export type MilestonePayload = {
  category: string;
  description: string;
};

export type PayloadByType = {
  journal: JournalPayload;
  photo: PhotoPayload;
  growth: GrowthPayload;
  vaccine: VaccinePayload;
  sleep: SleepPayload;
  milestone: MilestonePayload;
};

export type BabyRecord<T extends RecordType = RecordType> = {
  id: string;
  childId: string;
  type: T;
  occurredAt: string;
  title?: string;
  note?: string;
  mediaIds?: string[];
  payload: PayloadByType[T];
  createdAt: string;
  updatedAt: string;
};

export type MediaAsset = {
  id: string;
  childId: string;
  kind: "image";
  blob: Blob;
  createdAt: string;
};

export type RecordDraft<T extends RecordType = RecordType> = {
  type: T;
  childId: string;
  occurredAt: string;
  title?: string;
  note?: string;
  mediaIds?: string[];
  payload: PayloadByType[T];
};
