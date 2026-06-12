import { GrowthChart } from "../components/data/GrowthChart";
import { SleepSummary } from "../components/data/SleepSummary";
import { VaccineList } from "../components/data/VaccineList";
import type { BabyRecord } from "../domain/types";

export type DataPageProps = {
  records: BabyRecord[];
};

export function DataPage({ records }: DataPageProps) {
  return (
    <div className="space-y-5">
      <header>
        <p className="text-sm text-muted">结构化记录</p>
        <h2 className="mt-1 text-2xl font-semibold text-ink">数据</h2>
      </header>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="lg:col-span-2">
          <GrowthChart records={records} />
        </div>
        <SleepSummary records={records} />
        <VaccineList records={records} />
      </div>
    </div>
  );
}
