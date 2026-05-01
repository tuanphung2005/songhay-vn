"use client"

import { Skeleton } from "@/components/ui/boneyard-skeleton"
import { ChevronLeft, ChevronRight } from "lucide-react"
import Image from "next/image"
import { useMemo, useState } from "react"

const CAN = ["Giáp", "Ất", "Bính", "Đinh", "Mậu", "Kỷ", "Canh", "Tân", "Nhâm", "Quý"]
const CHI = ["Tý", "Sửu", "Dần", "Mão", "Thìn", "Tỵ", "Ngọ", "Mùi", "Thân", "Dậu", "Tuất", "Hợi"]
const GIO_CHI_LABEL: Record<string, string> = {
  "Tý": "23h-1h",
  "Sửu": "1h-3h",
  "Dần": "3h-5h",
  "Mão": "5h-7h",
  "Thìn": "7h-9h",
  "Tỵ": "9h-11h",
  "Ngọ": "11h-13h",
  "Mùi": "13h-15h",
  "Thân": "15h-17h",
  "Dậu": "17h-19h",
  "Tuất": "19h-21h",
  "Hợi": "21h-23h",
}
const HOANG_DAO_BY_DAY_CHI: Record<string, string[]> = {
  "Tý": ["Tý", "Sửu", "Mão", "Ngọ", "Thân", "Dậu"],
  "Ngọ": ["Tý", "Sửu", "Mão", "Ngọ", "Thân", "Dậu"],
  "Sửu": ["Dần", "Mão", "Tỵ", "Thân", "Tuất", "Hợi"],
  "Mùi": ["Dần", "Mão", "Tỵ", "Thân", "Tuất", "Hợi"],
  "Dần": ["Tý", "Sửu", "Thìn", "Tỵ", "Mùi", "Tuất"],
  "Thân": ["Tý", "Sửu", "Thìn", "Tỵ", "Mùi", "Tuất"],
  "Mão": ["Dần", "Mão", "Ngọ", "Mùi", "Dậu", "Tý"],
  "Dậu": ["Dần", "Mão", "Ngọ", "Mùi", "Dậu", "Tý"],
  "Thìn": ["Thìn", "Tỵ", "Thân", "Dậu", "Hợi", "Dần"],
  "Tuất": ["Thìn", "Tỵ", "Thân", "Dậu", "Hợi", "Dần"],
  "Tỵ": ["Sửu", "Thìn", "Ngọ", "Mùi", "Tuất", "Hợi"],
  "Hợi": ["Sửu", "Thìn", "Ngọ", "Mùi", "Tuất", "Hợi"],
}

function getDayCanChi(date: Date) {
  const utcMidnight = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  const dayIndex = Math.floor(utcMidnight / 86_400_000)

  const can = CAN[(dayIndex + 6) % 10]
  const chi = CHI[(dayIndex + 8) % 12]

  return { can, chi }
}

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

type LunarCalendarWidgetProps = {
  loading?: boolean
}

export function LunarCalendarWidget({ loading }: LunarCalendarWidgetProps) {
  const [currentDate, setCurrentDate] = useState(() => new Date())
  const today = useMemo(() => new Date(), [])

  const dayNumber = useMemo(() => currentDate.getDate(), [currentDate])
  const monthNumber = useMemo(() => currentDate.getMonth() + 1, [currentDate])
  const yearNumber = useMemo(() => currentDate.getFullYear(), [currentDate])
  const isCurrentToday = useMemo(
    () =>
      currentDate.getDate() === today.getDate() &&
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear(),
    [currentDate, today]
  )
  const shortDate = useMemo(
    () =>
      new Intl.DateTimeFormat("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }).format(currentDate),
    [currentDate]
  )
  const weekdayLabel = useMemo(
    () =>
      new Intl.DateTimeFormat("vi-VN", {
        weekday: "long",
      }).format(currentDate),
    [currentDate]
  )
  const amLich = useMemo(() => getLunarDateLabel(currentDate), [currentDate])
  const dayCanChi = useMemo(() => getDayCanChi(currentDate), [currentDate])
  const zodiacDay = useMemo(() => {
    return `${dayCanChi.can} ${dayCanChi.chi}`
  }, [dayCanChi])
  const zodiacMonth = useMemo(() => {
    const chi = ["Dần", "Mão", "Thìn", "Tỵ", "Ngọ", "Mùi", "Thân", "Dậu", "Tuất", "Hợi", "Tý", "Sửu"]

    return `${CAN[(monthNumber + yearNumber) % 10]} ${chi[(monthNumber - 1) % 12]}`
  }, [monthNumber, yearNumber])
  const gioHoangDao = useMemo(() => {
    const chiHours = HOANG_DAO_BY_DAY_CHI[dayCanChi.chi] ?? HOANG_DAO_BY_DAY_CHI["Tý"]

    return chiHours.map((chi) => `${chi} (${GIO_CHI_LABEL[chi]})`).join(", ")
  }, [dayCanChi])

  const moveDate = (days: number) => {
    setCurrentDate((prev) => {
      const next = new Date(prev)
      next.setDate(prev.getDate() + days)
      return next
    })
  }

  return (
    <Skeleton name="lunar-calendar-widget" loading={loading}>
      <section className="border-t border-zinc-200 bg-white shadow-none">
        <h3 className="border-b border-zinc-200 bg-zinc-50 px-4 py-3 text-base font-bold text-zinc-800">Âm lịch - Dương lịch</h3>

        <div className="space-y-3 p-3">
          <div className="border border-zinc-300 bg-zinc-50 px-3 py-2 text-center">
            <p className="text-sm font-medium uppercase tracking-wide text-zinc-500">
              {isCurrentToday ? "Hôm nay" : ""}
            </p>
            <div className="mt-1 flex items-center justify-between">
              <button
                type="button"
                aria-label="Ngày trước"
                className="p-1 text-zinc-500 transition hover:bg-zinc-200 hover:text-zinc-700"
                onClick={() => moveDate(-1)}
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <p className="text-base font-semibold capitalize text-zinc-700">
                {weekdayLabel}, {shortDate}
              </p>
              <button
                type="button"
                aria-label="Ngày sau"
                className="rounded-full p-1 text-zinc-500 transition hover:bg-zinc-200 hover:text-zinc-700"
                onClick={() => moveDate(1)}
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="rounded-lg bg-white p-3 text-center">
            <div className="relative mx-auto h-40 w-40">
              <Image
                src="/widget_calendar_circle.png"
                alt="Vòng tròn lịch âm"
                width={176}
                height={176}
                className="h-full w-full object-contain"
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                <p className="text-xl font-bold">Tháng {monthNumber}</p>
                <p className="text-5xl leading-none font-black">{dayNumber}</p>
              </div>
            </div>
            <p className="mt-3 text-sm font-semibold text-zinc-700">Ngày: {zodiacDay}, tháng: {zodiacMonth}</p>
            <p className="mt-1 text-sm text-zinc-600">Âm lịch: {amLich}</p>
          </div>

          <div className="border-t border-zinc-200 bg-white p-3">
            <p className="text-base font-bold text-zinc-700">Giờ Hoàng Đạo (giờ tốt)</p>
            <p className="mt-2 text-sm leading-6 text-zinc-600">
              {gioHoangDao}
            </p>
          </div>
        </div>
      </section>
    </Skeleton>
  )
}
