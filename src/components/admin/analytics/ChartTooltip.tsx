"use client";

type TooltipPayloadItem = {
  name?: string;
  value?: number | string;
  color?: string;
};

export function ChartTooltip({
  active,
  payload,
  label,
  valueFormatter = (v: number) => String(v),
}: {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
  valueFormatter?: (value: number) => string;
}) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="rounded-lg border bg-popover p-2 text-xs shadow-md">
      <p className="mb-1 text-muted-foreground">{label}</p>
      {payload.map((item, i) => (
        <div key={i} className="flex items-center gap-2">
          <span
            className="inline-block h-0.5 w-3 shrink-0"
            style={{ backgroundColor: item.color }}
          />
          <span className="font-semibold text-foreground">
            {typeof item.value === "number" ? valueFormatter(item.value) : item.value}
          </span>
          <span className="text-muted-foreground">{item.name}</span>
        </div>
      ))}
    </div>
  );
}
