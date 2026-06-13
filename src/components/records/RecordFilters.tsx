import { recordMeta, recordTypeOrder } from "../../domain/recordMeta";
import type { RecordType } from "../../domain/types";

export type RecordFilterValue = RecordType | "all";

export type RecordFiltersProps = {
  value: RecordFilterValue;
  onChange: (value: RecordFilterValue) => void;
};

const filterItems = [
  { value: "all", label: "全部" },
  ...recordTypeOrder.map((type) => ({
    value: type,
    label: recordMeta[type].label,
  })),
] as const;

export function RecordFilters({ value, onChange }: RecordFiltersProps) {
  return (
    <div className="flex flex-wrap gap-2 rounded-card border border-line bg-white p-2 shadow-sm" role="group" aria-label="记录类型筛选">
      {filterItems.map((item) => {
        const isActive = value === item.value;

        return (
          <button
            key={item.value}
            type="button"
            aria-pressed={isActive}
            onClick={() => onChange(item.value)}
            className={`min-h-9 rounded-card border px-3 text-sm font-medium transition ${
              isActive
                ? "border-primary bg-primary text-white shadow-sm"
                : "border-transparent bg-transparent text-muted hover:bg-mist hover:text-ink"
            }`}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
