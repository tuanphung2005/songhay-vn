"use client"

import { CalendarDays, Compass, Sparkles } from "lucide-react"
import Link from "next/link"
import { useMemo, useState } from "react"

function toInputDate(value: Date) {
  const year = value.getFullYear()
  const month = String(value.getMonth() + 1).padStart(2, "0")
  const day = String(value.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function toDisplayDate(value: string) {
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return ""
  }

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(parsed)
}

export function DontMissWidget() {
  const defaultBirthDate = useMemo(() => toInputDate(new Date(1998, 0, 1)), [])
  const defaultTargetDate = useMemo(() => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    return toInputDate(tomorrow)
  }, [])

  const [birthDate, setBirthDate] = useState(defaultBirthDate)
  const [targetDate, setTargetDate] = useState(defaultTargetDate)

  return (
    <div className="grid gap-4 rounded-lg border border-zinc-200 bg-white p-3 md:grid-cols-[1.2fr_1fr] md:p-4">
      <div className="space-y-3 md:border-r md:border-zinc-200 md:pr-4">
        <p className="text-lg font-semibold text-zinc-800">Xem ngày tốt xấu theo tuổi?</p>

        <label className="flex items-center justify-between gap-3 rounded-md border border-zinc-200 px-3 py-2">
          <span className="text-sm font-medium text-zinc-600">Ngày sinh:</span>
          <input
            type="date"
            value={birthDate}
            onChange={(event) => setBirthDate(event.target.value)}
            className="rounded border border-zinc-200 bg-white px-2 py-1 text-sm text-zinc-700"
          />
        </label>

        <label className="flex items-center justify-between gap-3 rounded-md border border-zinc-200 px-3 py-2">
          <span className="text-sm font-medium text-zinc-600">Ngày cần xem:</span>
          <input
            type="date"
            value={targetDate}
            onChange={(event) => setTargetDate(event.target.value)}
            className="rounded border border-zinc-200 bg-white px-2 py-1 text-sm text-zinc-700"
          />
        </label>

        <button
          type="button"
          className="inline-flex h-10 items-center justify-center rounded-md bg-rose-600 px-8 text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-rose-700"
        >
          Xem
        </button>

        <p className="text-xs text-zinc-500">
          Kỳ xem: {toDisplayDate(targetDate)} {toDisplayDate(birthDate) ? `· Sinh ngày ${toDisplayDate(birthDate)}` : ""}
        </p>
      </div>

      <div className="space-y-2.5 md:pl-3">
        <Link
          href="/tu-vi"
          className="flex items-center gap-2 rounded-md px-2 py-2 text-zinc-700 transition hover:bg-zinc-100 hover:text-rose-600"
        >
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-zinc-300 bg-zinc-50">
            <CalendarDays className="h-4 w-4" />
          </span>
          <span className="font-semibold">Tử vi hàng ngày</span>
        </Link>

        <Link
          href="/tu-vi"
          className="flex items-center gap-2 rounded-md px-2 py-2 text-zinc-700 transition hover:bg-zinc-100 hover:text-rose-600"
        >
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-zinc-300 bg-zinc-50">
            <Compass className="h-4 w-4" />
          </span>
          <span className="font-semibold">Lập lá số tử vi</span>
        </Link>

        <Link
          href="/"
          className="flex items-center gap-2 rounded-md px-2 py-2 text-zinc-700 transition hover:bg-zinc-100 hover:text-rose-600"
        >
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-zinc-300 bg-zinc-50">
            <Sparkles className="h-4 w-4" />
          </span>
          <span className="font-semibold">Xem thần số học miễn phí</span>
        </Link>
      </div>
    </div>
  )
}
