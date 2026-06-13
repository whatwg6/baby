import type { BabyRecord } from "../../domain/types";
import { buildSleepSummary } from "../../services/recordService";

export type SleepSummaryProps = {
  records: BabyRecord[];
};

function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours === 0) {
    return `${remainingMinutes} 分钟`;
  }

  return `${hours}小时${remainingMinutes}分钟`;
}

export function SleepSummary({ records }: SleepSummaryProps) {
  const summary = buildSleepSummary(records);

  return (
    <section className="rounded-card border border-line bg-white p-4 shadow-panel sm:p-5">
      <p className="text-sm text-muted">按已记录睡眠计算</p>
      <h2 className="mt-1 text-lg font-semibold text-ink">睡眠概览</h2>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <Stat label="记录次数" value={`${summary.count} 次`} />
        <Stat label="平均时长" value={formatDuration(summary.averageMinutes)} />
      </div>

      {summary.count === 0 ? <p className="mt-3 text-sm text-muted">还没有睡眠记录。</p> : null}
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-card border border-line bg-mist/70 p-3">
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-1 break-words text-xl font-semibold text-ink">{value}</p>
    </div>
  );
}
