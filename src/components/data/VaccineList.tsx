import type { BabyRecord } from "../../domain/types";

export type VaccineListProps = {
  records: BabyRecord[];
};

function vaccineDateText(record: BabyRecord<"vaccine">): string {
  if (record.payload.completedDate) {
    return `完成日期：${record.payload.completedDate}`;
  }

  if (record.payload.scheduledDate) {
    return `计划日期：${record.payload.scheduledDate}`;
  }

  return "未填写日期";
}

export function VaccineList({ records }: VaccineListProps) {
  const vaccines = records.filter((record): record is BabyRecord<"vaccine"> => record.type === "vaccine");

  return (
    <section className="rounded-card border border-line bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm text-muted">用户填写的接种信息</p>
          <h2 className="mt-1 text-lg font-semibold text-ink">疫苗记录</h2>
        </div>
        <p className="shrink-0 text-sm text-muted">{vaccines.length} 条</p>
      </div>

      <div className="mt-4 space-y-2">
        {vaccines.length > 0 ? (
          vaccines.map((record) => (
            <article key={record.id} className="rounded-card bg-cream p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="break-words text-sm font-semibold text-ink">{record.payload.vaccineName}</h3>
                  <p className="mt-1 text-xs text-muted">{vaccineDateText(record)}</p>
                </div>
                {record.payload.dose ? (
                  <p className="shrink-0 rounded-card border border-line bg-white px-2 py-1 text-xs text-muted">
                    {record.payload.dose}
                  </p>
                ) : null}
              </div>
              {record.payload.location ? <p className="mt-2 text-xs text-muted">地点：{record.payload.location}</p> : null}
            </article>
          ))
        ) : (
          <p className="rounded-card bg-cream p-4 text-sm text-muted">还没有疫苗记录。</p>
        )}
      </div>
    </section>
  );
}
