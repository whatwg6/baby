import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { BabyRecord } from "../../domain/types";
import { buildGrowthSeries } from "../../services/recordService";

export type GrowthChartProps = {
  records: BabyRecord[];
};

export function GrowthChart({ records }: GrowthChartProps) {
  const data = buildGrowthSeries(records);

  return (
    <section className="rounded-card border border-line bg-white p-4 shadow-panel sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm text-muted">身高、体重与头围</p>
          <h2 className="mt-1 text-lg font-semibold text-ink">成长趋势</h2>
        </div>
        <p className="shrink-0 rounded-card bg-mist px-3 py-1 text-sm font-medium text-primary">{data.length} 条</p>
      </div>

      <div className="mt-4 h-64 rounded-card bg-gradient-to-b from-mist/70 to-white p-2">
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: -16 }}>
              <XAxis dataKey="date" tick={{ fontSize: 12, fill: "#6F7C76" }} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: "#6F7C76" }} tickLine={false} width={42} />
              <Tooltip />
              <Line type="monotone" dataKey="heightCm" stroke="#5B8DEF" strokeWidth={2} name="身高 cm" connectNulls />
              <Line type="monotone" dataKey="weightKg" stroke="#E98B7C" strokeWidth={2} name="体重 kg" connectNulls />
              <Line
                type="monotone"
                dataKey="headCircumferenceCm"
                stroke="#E8B84A"
                strokeWidth={2}
                name="头围 cm"
                connectNulls
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center rounded-card border border-dashed border-line bg-white/70 px-4 text-center text-sm text-muted">
            还没有成长数据。记录身高、体重或头围后，这里会显示趋势。
          </div>
        )}
      </div>
    </section>
  );
}
