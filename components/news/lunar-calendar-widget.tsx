"use client"

import { useMemo } from "react"

function getLunarDateLabel(date: Date) {
  const fallback = `Ngày ${date.getDate()} tháng ${date.getMonth() + 1} (tham khảo âm lịch)`

  try {
    const formatter = new Intl.DateTimeFormat("vi-VN-u-ca-chinese", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })

    return formatter.format(date)
  } catch {
    return fallback
  }
}

export function LunarCalendarWidget() {
  const now = useMemo(() => new Date(), [])
  const dayNumber = useMemo(() => now.getDate(), [now])
  const monthNumber = useMemo(() => now.getMonth() + 1, [now])
  const duongLich = useMemo(
    () =>
      new Intl.DateTimeFormat("vi-VN", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(now),
    [now]
  )
  const amLich = useMemo(() => getLunarDateLabel(now), [now])

  return (
    <section className="rounded-xl">
      <div className="relative overflow-hidden rounded-lg bg-white shadow-sm">
        <div className="bg-rose-600 px-4 py-3 text-center text-white">
          <p className="text-xs font-semibold uppercase tracking-[0.2em]">Lịch âm hôm nay</p>
          <p className="mt-1 text-sm font-medium">Tháng {monthNumber}</p>
        </div>

        <div className="pointer-events-none absolute left-3 top-2 h-3 w-3 rounded-full bg-zinc-100 ring-2 ring-rose-200" />
        <div className="pointer-events-none absolute right-3 top-2 h-3 w-3 rounded-full bg-zinc-100 ring-2 ring-rose-200" />

        <div className="space-y-3 px-4 pb-4 pt-5 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Dương lịch</p>
          <p className="text-6xl leading-none font-black text-zinc-900">{dayNumber}</p>
          <p className="text-sm text-zinc-600">{duongLich}</p>

          <div className="border-t border-dashed border-zinc-300 pt-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Âm lịch</p>
            <p className="mt-1 text-sm font-bold text-rose-700">{amLich}</p>
          </div>
        </div>
      </div>
    </section>
  )
}
