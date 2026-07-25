"use client";

import {
  BarChart,
  Bar,
  Cell,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  LabelList,
  ResponsiveContainer,
} from "recharts";
import { ChartTooltip } from "./ChartTooltip";

const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--chart-6)",
  "var(--chart-7)",
  "var(--chart-8)",
];

export function RevenueByCategoryChart({
  data,
}: {
  data: { name: string; revenue: number; colorIndex: number }[];
}) {
  if (data.length === 0) {
    return (
      <div className="rounded-xl border p-4">
        <h3 className="mb-4 text-sm font-semibold">Revenue by category</h3>
        <p className="text-sm text-muted-foreground">No categories yet.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border p-4">
      <h3 className="mb-4 text-sm font-semibold">Revenue by category</h3>
      <p className="mb-2 text-xs text-muted-foreground">
        Games in more than one category count toward each.
      </p>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data} margin={{ top: 16, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="0" vertical={false} stroke="var(--border)" />
          <XAxis
            dataKey="name"
            tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
            axisLine={{ stroke: "var(--border)" }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v: number) => `$${v}`}
            width={56}
          />
          <Tooltip
            cursor={{ fill: "var(--muted)" }}
            content={<ChartTooltip valueFormatter={(v) => `$${v.toFixed(2)}`} />}
          />
          <Bar dataKey="revenue" name="Revenue" radius={[4, 4, 0, 0]} maxBarSize={64}>
            {data.map((entry) => (
              <Cell
                key={entry.name}
                fill={CHART_COLORS[entry.colorIndex % CHART_COLORS.length]}
              />
            ))}
            <LabelList
              dataKey="revenue"
              position="top"
              formatter={(v) => (typeof v === "number" ? `$${v.toFixed(0)}` : "")}
              style={{ fill: "var(--muted-foreground)", fontSize: 11 }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
