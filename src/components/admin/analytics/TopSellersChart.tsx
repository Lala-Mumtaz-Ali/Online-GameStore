"use client";

import {
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  LabelList,
  ResponsiveContainer,
} from "recharts";
import { ChartTooltip } from "./ChartTooltip";

export function TopSellersChart({
  data,
}: {
  data: { title: string; unitsSold: number }[];
}) {
  if (data.length === 0) {
    return (
      <div className="rounded-xl border p-4">
        <h3 className="mb-4 text-sm font-semibold">Top selling games</h3>
        <p className="text-sm text-muted-foreground">No sales yet.</p>
      </div>
    );
  }

  const height = Math.max(160, data.length * 36);

  return (
    <div className="rounded-xl border p-4">
      <h3 className="mb-4 text-sm font-semibold">Top selling games</h3>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 0, right: 32, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="0" horizontal={false} stroke="var(--border)" />
          <XAxis
            type="number"
            tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
          />
          <YAxis
            type="category"
            dataKey="title"
            tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            width={140}
          />
          <Tooltip
            cursor={{ fill: "var(--muted)" }}
            content={<ChartTooltip valueFormatter={(v) => `${v} sold`} />}
          />
          <Bar dataKey="unitsSold" name="Units sold" fill="var(--chart-1)" radius={[0, 4, 4, 0]} maxBarSize={24}>
            <LabelList
              dataKey="unitsSold"
              position="right"
              style={{ fill: "var(--muted-foreground)", fontSize: 11 }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
