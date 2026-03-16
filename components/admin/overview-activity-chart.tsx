"use client"

import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"

import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

type OverviewDailyPoint = {
  label: string
  views: number
  comments: number
  posts: number
}

type OverviewActivityChartProps = {
  data: OverviewDailyPoint[]
}

const overviewChartConfig = {
  views: {
    label: "Views",
    color: "#2563eb",
  },
  comments: {
    label: "Comments",
    color: "#60a5fa",
  },
} satisfies ChartConfig

export function OverviewActivityChart({ data }: OverviewActivityChartProps) {
  return (
    <ChartContainer config={overviewChartConfig} className="h-[280px] w-full">
      <BarChart accessibilityLayer data={data} margin={{ left: 8, right: 8, top: 8 }}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
        />
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent indicator="dashed" />}
        />
        <Bar dataKey="views" fill="var(--color-views)" radius={4} />
        <Bar dataKey="comments" fill="var(--color-comments)" radius={4} />
      </BarChart>
    </ChartContainer>
  )
}
