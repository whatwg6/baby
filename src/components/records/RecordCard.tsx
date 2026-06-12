import { recordMeta } from "../../domain/recordMeta";
import type { BabyRecord } from "../../domain/types";
import { formatTimeLabel } from "../../lib/date";
import { summarizeRecord } from "../../services/recordService";

export type RecordCardProps = {
  record: BabyRecord;
};

function safeFormatTimeLabel(value: string): string {
  try {
    return formatTimeLabel(value);
  } catch {
    return "日期无效";
  }
}

export function RecordCard({ record }: RecordCardProps) {
  const meta = recordMeta[record.type];
  const Icon = meta.icon;
  const summary = summarizeRecord(record);
  const timeLabel = safeFormatTimeLabel(record.occurredAt);

  return (
    <article className="rounded-card border border-line bg-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-card ${meta.bgClass} ${meta.colorClass}`}
          aria-hidden="true"
        >
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-medium text-muted">{meta.label}</p>
              <h3 className="mt-1 break-words text-base font-semibold text-ink">{record.title?.trim() || summary}</h3>
            </div>
            <time className="shrink-0 text-sm text-muted" dateTime={record.occurredAt}>
              {timeLabel}
            </time>
          </div>
          {record.title?.trim() ? <p className="mt-2 break-words text-sm text-muted">{summary}</p> : null}
          {record.note?.trim() ? <p className="mt-3 break-words text-sm leading-6 text-ink">{record.note.trim()}</p> : null}
          {record.mediaIds && record.mediaIds.length > 0 ? (
            <div className="mt-3 h-16 w-16 rounded-card border border-line bg-cream" aria-label="照片占位" />
          ) : null}
        </div>
      </div>
    </article>
  );
}
