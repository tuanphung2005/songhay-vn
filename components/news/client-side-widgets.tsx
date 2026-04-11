"use client"

import dynamic from "next/dynamic"

const AiWeatherWidget = dynamic(
  () => import("./ai-weather-widget").then((mod) => mod.AiWeatherWidget),
  { ssr: false, loading: () => <div className="h-40 animate-pulse rounded-lg bg-zinc-100" /> }
)
const LunarCalendarWidget = dynamic(
  () => import("./lunar-calendar-widget").then((mod) => mod.LunarCalendarWidget),
  { ssr: false, loading: () => <div className="h-40 animate-pulse rounded-lg bg-zinc-100" /> }
)

export function ClientSideWidgets() {
  return (
    <>
      <LunarCalendarWidget />
      <AiWeatherWidget />
    </>
  )
}
