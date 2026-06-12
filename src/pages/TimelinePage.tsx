import { RecordCard } from "../components/records/RecordCard";
import { RecordFilters } from "../components/records/RecordFilters";
import type { BabyRecord, RecordType } from "../domain/types";
import { formatDateLabel, groupRecordsByDay, toDayKey } from "../lib/date";

export type TimelinePageProps = {
  records: BabyRecord[];
  filter: RecordType | "all";
  onFilterChange: (type: RecordType | "all") => void;
};

export function TimelinePage({ records, filter, onFilterChange }: TimelinePageProps) {
  const validRecords = records.filter((record) => {
    try {
      toDayKey(record.occurredAt);
      return true;
    } catch {
      return false;
    }
  });
  const groups = groupRecordsByDay(validRecords);

  return (
    <div className="space-y-5">
      <header className="space-y-3">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-sm text-muted">{records.length} 条记录</p>
            <h2 className="mt-1 text-2xl font-semibold text-ink">时间线</h2>
          </div>
        </div>
        <RecordFilters value={filter} onChange={onFilterChange} />
      </header>

      {groups.length > 0 ? (
        <div className="space-y-6">
          {groups.map((group) => (
            <section key={group.date}>
              <h3 className="mb-3 text-sm font-semibold text-muted">{formatDateLabel(group.date)}</h3>
              <div className="space-y-3">
                {group.records.map((record) => (
                  <RecordCard key={record.id} record={record} />
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <p className="rounded-card border border-line bg-white p-4 text-sm text-muted shadow-sm">
          还没有符合条件的记录。
        </p>
      )}
      {validRecords.length < records.length ? (
        <p className="rounded-card border border-warning/30 bg-white p-3 text-sm text-warning" role="status">
          有 {records.length - validRecords.length} 条记录日期无效，暂未显示。
        </p>
      ) : null}
    </div>
  );
}
