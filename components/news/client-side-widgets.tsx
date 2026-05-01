"use client"

import dynamic from "next/dynamic"

import { Skeleton } from "@/components/ui/boneyard-skeleton"

const AiWeatherWidget = dynamic(
  () => import("./ai-weather-widget").then((mod) => mod.AiWeatherWidget),
  { ssr: false, loading: () => <Skeleton name="ai-weather-widget" loading /> }
)
const LunarCalendarWidget = dynamic(
  () => import("./lunar-calendar-widget").then((mod) => mod.LunarCalendarWidget),
  { ssr: false, loading: () => <Skeleton name="lunar-calendar-widget" loading /> }
)

export function ClientSideWidgets() {
  return (
    <>
      <LunarCalendarWidget />
      <AiWeatherWidget />
    </>
  )
}
