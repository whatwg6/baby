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
    <div className="flex flex-wrap gap-2" role="group" aria-label="记录类型筛选">
      {filterItems.map((item) => {
        const isActive = value === item.value;

        return (
          <button
            key={item.value}
            type="button"
            aria-pressed={isActive}
            onClick={() => onChange(item.value)}
            className={`min-h-10 rounded-card border px-3 text-sm font-medium transition ${
              isActive
                ? "border-primary bg-primary text-white"
                : "border-line bg-white text-ink hover:border-primary/50 hover:text-primary"
            }`}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
