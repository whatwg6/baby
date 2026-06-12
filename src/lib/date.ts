import type { BabyRecord } from "../domain/types";

export type RecordsByDay = {
  date: string;
  records: BabyRecord[];
};

const invalidDateLabel = "日期无效";

function isValidDate(date: Date): boolean {
  return !Number.isNaN(date.getTime());
}

function parseLocalDate(value: string): Date {
  const localDateMatch = value.match(
    /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2})(?::(\d{2})(?:\.\d{1,3})?)?)?$/,
  );

  if (!localDateMatch) {
    return new Date(value);
  }

  const [, yearValue, monthValue, dayValue, hourValue = "00", minuteValue = "00", secondValue = "00"] =
    localDateMatch;
  const year = Number(yearValue);
  const monthIndex = Number(monthValue) - 1;
  const day = Number(dayValue);
  const hour = Number(hourValue);
  const minute = Number(minuteValue);
  const second = Number(secondValue);
  const date = new Date(year, monthIndex, day, hour, minute, second);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== monthIndex ||
    date.getDate() !== day ||
    date.getHours() !== hour ||
    date.getMinutes() !== minute ||
    date.getSeconds() !== second
  ) {
    return new Date(Number.NaN);
  }

  return date;
}

function requireValidDate(value: string): Date {
  const date = parseLocalDate(value);

  if (!isValidDate(date)) {
    throw new RangeError(invalidDateLabel);
  }

  return date;
}

export function calculateAgeText(birthday: string, now = new Date()): string {
  const birth = parseLocalDate(birthday);

  if (!isValidDate(birth) || !isValidDate(now)) {
    return invalidDateLabel;
  }

  if (birth.getTime() > now.getTime()) {
    return "未出生";
  }

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
  const date = requireValidDate(value);

  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  }).format(date);
}

export function formatTimeLabel(value: string): string {
  const date = requireValidDate(value);

  return new Intl.DateTimeFormat("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function toDayKey(value: string): string {
  const date = requireValidDate(value);
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function minutesBetween(startTime: string, endTime: string): number {
  const minutes = (requireValidDate(endTime).getTime() - requireValidDate(startTime).getTime()) / 60000;

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
