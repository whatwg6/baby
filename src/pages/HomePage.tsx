import { CalendarDays, Clock3, TrendingUp } from "lucide-react";
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
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className="space-y-5">
        <section className="overflow-hidden rounded-card border border-line bg-white shadow-panel">
          <div className="border-b border-line bg-mist/70 p-5 sm:flex sm:items-center sm:justify-between sm:gap-4">
            <div>
              <p className="text-sm font-medium text-primary">{todayLabel()}</p>
              <h2 className="mt-1 text-2xl font-semibold text-ink">今日记录</h2>
              <p className="mt-2 max-w-xl text-sm leading-6 text-muted">
                快速补上一条喂养、睡眠、成长或照片，让一天的变化留下清晰线索。
              </p>
            </div>
            <div className="mt-4 hidden h-14 w-14 shrink-0 items-center justify-center rounded-card bg-white text-primary shadow-soft sm:flex">
              <CalendarDays className="h-6 w-6" aria-hidden="true" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3 sm:p-5">
            {recordTypeOrder.map((type) => {
              const meta = recordMeta[type];
              const Icon = meta.icon;

              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => onStartRecord(type)}
                  className="group flex min-h-24 items-center gap-3 rounded-card border border-line bg-white p-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-soft"
                >
                  <span
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-card ${meta.bgClass} ${meta.colorClass}`}
                    aria-hidden="true"
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="min-w-0 break-words text-sm font-semibold text-ink group-hover:text-primary">
                    {meta.actionLabel}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-2 lg:hidden" aria-label="成长摘要">
          <SummaryTile icon={TrendingUp} label="最新身高体重" value={latestGrowth} />
          <SummaryTile icon={Clock3} label="睡眠概览" value={sleepSummary} />
        </section>

        <section className="rounded-card border border-line bg-white p-4 shadow-panel sm:p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm text-muted">最近同步</p>
              <h2 className="mt-1 text-lg font-semibold text-ink">最近记录</h2>
            </div>
            <p className="rounded-card bg-mist px-3 py-1 text-sm font-medium text-primary">{records.length} 条</p>
          </div>
          <div className="space-y-3">
            {recentRecords.length > 0 ? (
              recentRecords.map((record) => <RecordCard key={record.id} record={record} />)
            ) : (
              <p className="rounded-card border border-dashed border-line bg-mist/70 p-4 text-sm text-muted">
                今天还没有记录新的瞬间。
              </p>
            )}
          </div>
        </section>
      </div>

      <aside className="hidden space-y-3 lg:block" aria-label="成长摘要">
        <section className="sticky top-24 rounded-card border border-line bg-white p-4 shadow-panel">
          <div>
            <p className="text-sm text-muted">自动汇总</p>
            <h2 className="mt-1 text-lg font-semibold text-ink">成长摘要</h2>
          </div>
          <div className="mt-4 space-y-3">
            <SummaryTile icon={TrendingUp} label="最新身高体重" value={latestGrowth} />
            <SummaryTile icon={Clock3} label="睡眠概览" value={sleepSummary} />
          </div>
        </section>
      </aside>
    </div>
  );
}

function SummaryTile({ icon: Icon, label, value }: { icon: typeof TrendingUp; label: string; value: string }) {
  return (
    <div className="rounded-card border border-line bg-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-card bg-mist text-primary">
          <Icon aria-hidden="true" className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <p className="text-sm text-muted">{label}</p>
          <p className="mt-1 break-words text-base font-semibold text-ink">{value}</p>
        </div>
      </div>
    </div>
  );
}
