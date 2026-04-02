"use client"

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"

import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

type OverviewDailyPoint = {
  label: string
  avgDwellSeconds: number
}

type OverviewDwellChartProps = {
  data: OverviewDailyPoint[]
}

const chartConfig = {
  avgDwellSeconds: {
    label: "Thời gian ở lại",
    color: "#10b981", // emerald-500
  },
} satisfies ChartConfig

export function OverviewDwellChart({ data }: OverviewDwellChartProps) {
  function formatTooltipValue(value: number) {
    if (value <= 0) return "0s"
    const m = Math.floor(value / 60)
    const s = value % 60
    return m > 0 ? `${m}m ${String(s).padStart(2, "0")}s` : `${s}s`
  }

  return (
    <ChartContainer config={chartConfig} className="h-[200px] w-full">
      <AreaChart accessibilityLayer data={data} margin={{ left: 0, right: 0, top: 10, bottom: 0 }}>
        <defs>
          <linearGradient id="fillDwell" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-avgDwellSeconds)" stopOpacity={0.3} />
            <stop offset="95%" stopColor="var(--color-avgDwellSeconds)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          hide
        />
        <YAxis hide domain={[0, "auto"]} />
        <ChartTooltip
          cursor={{ stroke: "#10b981", strokeWidth: 1 }}
          content={
            <ChartTooltipContent
              hideLabel
              formatter={(value) => (
                <div className="flex items-center gap-2">
                  <div className="size-2 rounded-full bg-emerald-500" />
                  <span className="font-bold">{formatTooltipValue(Number(value))}</span>
                </div>
              )}
            />
          }
        />
        <Area
          dataKey="avgDwellSeconds"
          type="monotone"
          stroke="var(--color-avgDwellSeconds)"
          strokeWidth={2}
          fillOpacity={1}
          fill="url(#fillDwell)"
          animationDuration={1500}
        />
      </AreaChart>
    </ChartContainer>
  )
}
