import { CalendarDays } from "lucide-react";
import { recordMeta, recordTypeOrder } from "../domain/recordMeta";
import type { BabyRecord, RecordType } from "../domain/types";
import { formatDateLabel } from "../lib/date";
import { buildGrowthSeries, buildSleepSummary } from "../services/recordService";
import { RecordCard } from "../components/records/RecordCard";

export type HomePageProps = {
  records: BabyRecord[];
  onStartRecord: (type: RecordType) => void;
};

function todayLabel(): string {
  return formatDateLabel(new Date().toISOString());
}

function latestGrowthText(records: BabyRecord[]): string {
  const latest = [...buildGrowthSeries(records)].at(-1);

  if (!latest) {
    return "暂无成长数据";
  }

  return [
    latest.heightCm !== undefined ? `${latest.heightCm} cm` : undefined,
    latest.weightKg !== undefined ? `${latest.weightKg} kg` : undefined,
    latest.headCircumferenceCm !== undefined ? `头围 ${latest.headCircumferenceCm} cm` : undefined,
  ]
    .filter(Boolean)
    .join(" · ");
}

function sleepSummaryText(records: BabyRecord[]): string {
  const summary = buildSleepSummary(records);

  if (summary.count === 0) {
    return "暂无睡眠记录";
  }

  const hours = Math.floor(summary.averageMinutes / 60);
  const minutes = summary.averageMinutes % 60;

  return `近 ${summary.count} 次平均 ${hours}小时${minutes}分钟`;
}

export function HomePage({ records, onStartRecord }: HomePageProps) {
  const recentRecords = records.slice(0, 5);
  const latestGrowth = latestGrowthText(records);
  const sleepSummary = sleepSummaryText(records);

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-5">
        <section>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm text-muted">{todayLabel()}</p>
              <h2 className="mt-1 text-2xl font-semibold text-ink">今日记录</h2>
            </div>
            <CalendarDays className="h-6 w-6 shrink-0 text-primary" aria-hidden="true" />
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {recordTypeOrder.map((type) => {
              const meta = recordMeta[type];
              const Icon = meta.icon;

              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => onStartRecord(type)}
                  className="flex min-h-20 items-center gap-3 rounded-card border border-line bg-white p-3 text-left shadow-sm transition hover:border-primary/50 hover:text-primary"
                >
                  <span
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-card ${meta.bgClass} ${meta.colorClass}`}
                    aria-hidden="true"
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="min-w-0 break-words text-sm font-semibold text-ink">{meta.actionLabel}</span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-2 lg:hidden" aria-label="成长摘要">
          <SummaryTile label="最新身高体重" value={latestGrowth} />
          <SummaryTile label="睡眠概览" value={sleepSummary} />
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-ink">最近记录</h2>
            <p className="text-sm text-muted">{records.length} 条</p>
          </div>
          <div className="space-y-3">
            {recentRecords.length > 0 ? (
              recentRecords.map((record) => <RecordCard key={record.id} record={record} />)
            ) : (
              <p className="rounded-card border border-line bg-white p-4 text-sm text-muted shadow-sm">
                今天还没有记录新的瞬间。
              </p>
            )}
          </div>
        </section>
      </div>

      <aside className="hidden space-y-3 lg:block" aria-label="成长摘要">
        <section className="rounded-card border border-line bg-white p-4 shadow-sm">
          <h2 className="text-lg font-semibold text-ink">成长摘要</h2>
          <div className="mt-4 space-y-4">
            <div>
              <p className="text-sm text-muted">最新身高体重</p>
              <p className="mt-1 text-base font-semibold text-ink">{latestGrowth}</p>
            </div>
            <div>
              <p className="text-sm text-muted">睡眠概览</p>
              <p className="mt-1 text-base font-semibold text-ink">{sleepSummary}</p>
            </div>
          </div>
        </section>
      </aside>
    </div>
  );
}

function SummaryTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-card border border-line bg-white p-4 shadow-sm">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-1 break-words text-base font-semibold text-ink">{value}</p>
    </div>
  );
}
