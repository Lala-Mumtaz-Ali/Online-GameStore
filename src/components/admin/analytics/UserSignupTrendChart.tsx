"use client";

import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { ChartTooltip } from "./ChartTooltip";

export function UserSignupTrendChart({
  data,
}: {
  data: { date: string; signups: number }[];
}) {
  return (
    <div className="rounded-xl border p-4">
      <h3 className="mb-4 text-sm font-semibold">New users — last 30 days</h3>
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="0" vertical={false} stroke="var(--border)" />
          <XAxis
            dataKey="date"
            tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
            axisLine={{ stroke: "var(--border)" }}
            tickLine={false}
            tickFormatter={(v: string) => v.slice(5)}
            minTickGap={24}
          />
          <YAxis
            tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
            width={32}
          />
          <Tooltip content={<ChartTooltip valueFormatter={(v) => `${v}`} />} />
          <Line
            type="monotone"
            dataKey="signups"
            name="Signups"
            stroke="var(--chart-5)"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, stroke: "var(--card)", strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
