import type { BabyRecord } from "../domain/types";

export type RecordsByDay = {
  date: string;
  records: BabyRecord[];
};

export function calculateAgeText(birthday: string, now = new Date()): string {
  const birth = new Date(`${birthday}T00:00:00`);
  let years = now.getFullYear() - birth.getFullYear();
  let months = now.getMonth() - birth.getMonth();

  if (now.getDate() < birth.getDate()) {
    months -= 1;
  }

  if (months < 0) {
    years -= 1;
    months += 12;
  }

  if (years <= 0 && months <= 0) {
    return "未满1个月";
  }

  if (years <= 0) {
    return `${months}个月`;
  }

  return months > 0 ? `${years}岁${months}个月` : `${years}岁`;
}

export function formatDateLabel(value: string): string {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  }).format(new Date(value));
}

export function formatTimeLabel(value: string): string {
  return new Intl.DateTimeFormat("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function toDayKey(value: string): string {
  const date = new Date(value);
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function minutesBetween(startTime: string, endTime: string): number {
  const minutes = (new Date(endTime).getTime() - new Date(startTime).getTime()) / 60000;

  return Math.max(0, Math.round(minutes));
}

export function groupRecordsByDay(records: BabyRecord[]): RecordsByDay[] {
  const groups = new Map<string, BabyRecord[]>();

  for (const record of records) {
    const key = toDayKey(record.occurredAt);
    groups.set(key, [...(groups.get(key) ?? []), record]);
  }

  return [...groups.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, groupedRecords]) => ({
      date,
      records: [...groupedRecords].sort(
        (a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime(),
      ),
    }));
}
