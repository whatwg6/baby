import type { Child } from "../../domain/types";
import { calculateAgeText } from "../../lib/date";

export type ChildSummaryProps = {
  child: Child | null;
};

const todayLabel = new Intl.DateTimeFormat("zh-CN", {
  month: "long",
  day: "numeric",
  weekday: "short",
}).format(new Date());

export function ChildSummary({ child }: ChildSummaryProps) {
  if (!child) {
    return (
      <section className="border-b border-line bg-white px-4 py-4 md:px-8">
        <div className="flex min-h-14 items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-card bg-cream" aria-hidden="true" />
            <div>
              <h1 className="text-xl font-semibold text-ink">宝宝资料加载中</h1>
              <p className="text-sm text-muted">正在准备成长档案</p>
            </div>
          </div>
          <p className="hidden text-sm text-muted sm:block">{todayLabel}</p>
        </div>
      </section>
    );
  }

  return (
    <section className="border-b border-line bg-white px-4 py-4 md:px-8">
      <div className="flex min-h-14 items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-card bg-primary/10 text-lg font-semibold text-primary">
            {child.avatarUrl ? (
              <img src={child.avatarUrl} alt={child.name} className="h-full w-full object-cover" />
            ) : (
              <span aria-hidden="true">{child.name.slice(0, 1)}</span>
            )}
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-xl font-semibold text-ink">{child.name}</h1>
            <p className="text-sm text-muted">{calculateAgeText(child.birthday)}</p>
          </div>
        </div>
        <p className="hidden shrink-0 text-sm text-muted sm:block">{todayLabel}</p>
      </div>
    </section>
  );
}
