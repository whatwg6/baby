import type { BabyRecord, RecordDraft } from "../domain/types";
import { minutesBetween } from "../lib/date";

export type GrowthPoint = {
  date: string;
  heightCm?: number;
  weightKg?: number;
  headCircumferenceCm?: number;
};

export type SleepSummary = {
  count: number;
  totalMinutes: number;
  averageMinutes: number;
};

function isBlank(value: string | undefined): boolean {
  return !value?.trim();
}

function hasGrowthMeasurement(payload: RecordDraft<"growth">["payload"]): boolean {
  return (
    payload.heightCm !== undefined ||
    payload.weightKg !== undefined ||
    payload.headCircumferenceCm !== undefined
  );
}

function formatNumber(value: number): string {
  return Number.isInteger(value) ? `${value}` : `${value}`;
}

export function validateDraft(draft: RecordDraft): string[] {
  const errors: string[] = [];

  if (isBlank(draft.childId)) {
    errors.push("请选择宝宝");
  }

  if (isBlank(draft.occurredAt)) {
    errors.push("请选择记录时间");
  }

  switch (draft.type) {
    case "journal":
      if (isBlank(draft.payload.body)) {
        errors.push("请输入日记内容");
      }
      break;
    case "photo":
      if (isBlank(draft.payload.mediaId)) {
        errors.push("请添加照片");
      }
      break;
    case "growth":
      if (!hasGrowthMeasurement(draft.payload)) {
        errors.push("请至少填写身高、体重或头围中的一项");
      }
      break;
    case "sleep": {
      if (isBlank(draft.payload.startTime)) {
        errors.push("请选择睡眠开始时间");
      }
      if (isBlank(draft.payload.endTime)) {
        errors.push("请选择睡眠结束时间");
      }

      const startTime = Date.parse(draft.payload.startTime);
      const endTime = Date.parse(draft.payload.endTime);
      if (Number.isFinite(startTime) && Number.isFinite(endTime) && endTime < startTime) {
        errors.push("睡眠结束时间不能早于开始时间");
      }
      break;
    }
    case "vaccine":
      if (isBlank(draft.payload.vaccineName)) {
        errors.push("请输入疫苗名称");
      }
      break;
    case "milestone":
      if (isBlank(draft.payload.category)) {
        errors.push("请选择里程碑分类");
      }
      if (isBlank(draft.payload.description)) {
        errors.push("请输入里程碑描述");
      }
      break;
  }

  return errors;
}

export function summarizeRecord(record: BabyRecord): string {
  switch (record.type) {
    case "journal":
      return record.title?.trim() || record.payload.body.trim() || "日记记录";
    case "photo":
      return record.payload.caption?.trim() ? `照片：${record.payload.caption.trim()}` : "照片记录";
    case "growth": {
      const parts = [
        record.payload.heightCm !== undefined ? `身高 ${formatNumber(record.payload.heightCm)} cm` : undefined,
        record.payload.weightKg !== undefined ? `体重 ${formatNumber(record.payload.weightKg)} kg` : undefined,
        record.payload.headCircumferenceCm !== undefined
          ? `头围 ${formatNumber(record.payload.headCircumferenceCm)} cm`
          : undefined,
      ].filter((part): part is string => part !== undefined);

      return parts.length > 0 ? parts.join(" · ") : "成长记录";
    }
    case "sleep":
      return `睡眠 ${minutesBetween(record.payload.startTime, record.payload.endTime)} 分钟`;
    case "vaccine":
      return [record.payload.vaccineName, record.payload.dose].filter(Boolean).join(" · ");
    case "milestone":
      return `${record.payload.category}：${record.payload.description}`;
  }
}

export function buildGrowthSeries(records: BabyRecord[]): GrowthPoint[] {
  return records
    .filter((record): record is BabyRecord<"growth"> => record.type === "growth")
    .sort((left, right) => left.occurredAt.localeCompare(right.occurredAt))
    .map((record) => ({
      date: record.occurredAt.slice(0, 10),
      heightCm: record.payload.heightCm,
      weightKg: record.payload.weightKg,
      headCircumferenceCm: record.payload.headCircumferenceCm,
    }));
}

export function buildSleepSummary(records: BabyRecord[]): SleepSummary {
  const sleepRecords = records.filter((record): record is BabyRecord<"sleep"> => record.type === "sleep");
  const totalMinutes = sleepRecords.reduce(
    (total, record) => total + minutesBetween(record.payload.startTime, record.payload.endTime),
    0,
  );

  return {
    count: sleepRecords.length,
    totalMinutes,
    averageMinutes: sleepRecords.length > 0 ? Math.round(totalMinutes / sleepRecords.length) : 0,
  };
}
