"use client"

import Link from "next/link"
import { useMemo, useState } from "react"

const canList = ["Canh", "Tan", "Nham", "Quy", "Giap", "At", "Binh", "Dinh", "Mau", "Ky"]
const chiList = ["Than", "Dau", "Tuat", "Hoi", "Ty", "Suu", "Dan", "Mao", "Thin", "Ti", "Ngo", "Mui"]
const dayOptions = Array.from({ length: 31 }, (_, index) => `${index + 1}`)
const monthOptions = Array.from({ length: 12 }, (_, index) => `${index + 1}`)
const yearOptions = Array.from({ length: 136 }, (_, index) => `${1911 + index}`)
const hourOptions = ["12 Giờ", "1 Giờ", "2 Giờ", "3 Giờ", "4 Giờ", "5 Giờ", "6 Giờ"]
const minuteOptions = ["00 Phút", "15 Phút", "30 Phút", "45 Phút"]
const timezoneOptions = ["GMT +7", "GMT +8", "GMT +9"]

export function TuViWidget() {
  const [fullName, setFullName] = useState("")
  const [birthDay, setBirthDay] = useState("1")
  const [birthMonth, setBirthMonth] = useState("1")
  const [birthYear, setBirthYear] = useState("1911")
  const [birthCalendar, setBirthCalendar] = useState<"duong" | "am">("duong")
  const [timezone, setTimezone] = useState("GMT +7")
  const [birthHour, setBirthHour] = useState("12 Giờ")
  const [birthMinute, setBirthMinute] = useState("30 Phút")
  const [gender, setGender] = useState("nu")
  const [viewYear, setViewYear] = useState("2026")
  const [viewLunarMonth, setViewLunarMonth] = useState("1")
  const [submitted, setSubmitted] = useState(false)

  const summary = useMemo(() => {
    const year = Number(birthYear)

    if (!year || year < 1900 || year > 2100) {
      return null
    }

    const can = canList[year % 10]
    const chi = chiList[year % 12]
    const tendency = gender === "nam" ? "đường công việc" : "đường tình cảm"
    const displayName = fullName.trim() || "Bạn"
    const calendarName = birthCalendar === "duong" ? "dương lịch" : "âm lịch"

    return `${displayName} (${can} ${chi}, ${calendarName}) sinh ${birthDay}/${birthMonth}/${birthYear} ${birthHour} ${birthMinute}, ${timezone}. Năm ${viewYear} âm lịch tháng ${viewLunarMonth} thuận cho ${tendency}.`
  }, [birthYear, gender, fullName, birthCalendar, birthDay, birthMonth, birthHour, birthMinute, timezone, viewYear, viewLunarMonth])

  return (
    <section className="space-y-4 rounded-xl border border-zinc-200 bg-white p-4">
      <h3 className="text-xl font-bold text-zinc-900">Lập lá số tử vi</h3>

      <div className="space-y-4">
        <label className="block space-y-1">
          <span className="text-sm font-medium text-zinc-700">Họ Tên</span>
          <input
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            type="text"
            className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm"
            placeholder="Nhập họ tên..."
          />
        </label>

        <div className="space-y-2">
          <p className="text-sm font-medium text-zinc-700">Ngày sinh</p>
          <div className="grid grid-cols-3 gap-2">
            <select
              value={birthDay}
              onChange={(event) => setBirthDay(event.target.value)}
              className="rounded-md border border-zinc-300 bg-white px-2 py-2 text-sm"
            >
              {dayOptions.map((day) => (
                <option key={day} value={day}>
                  {day}
                </option>
              ))}
            </select>

            <select
              value={birthMonth}
              onChange={(event) => setBirthMonth(event.target.value)}
              className="rounded-md border border-zinc-300 bg-white px-2 py-2 text-sm"
            >
              {monthOptions.map((month) => (
                <option key={month} value={month}>
                  Tháng {month}
                </option>
              ))}
            </select>

            <select
              value={birthYear}
              onChange={(event) => setBirthYear(event.target.value)}
              className="rounded-md border border-zinc-300 bg-white px-2 py-2 text-sm"
            >
              {yearOptions.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-3 text-sm text-zinc-700">
            <label className="inline-flex items-center gap-1.5">
              <input
                type="radio"
                checked={birthCalendar === "duong"}
                onChange={() => setBirthCalendar("duong")}
              />
              Lịch dương
            </label>
            <label className="inline-flex items-center gap-1.5">
              <input type="radio" checked={birthCalendar === "am"} onChange={() => setBirthCalendar("am")} />
              Lịch âm
            </label>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium text-zinc-700">Giờ sinh</p>
          <div className="grid grid-cols-3 gap-2">
            <select
              value={timezone}
              onChange={(event) => setTimezone(event.target.value)}
              className="rounded-md border border-zinc-300 bg-white px-2 py-2 text-sm"
            >
              {timezoneOptions.map((zone) => (
                <option key={zone} value={zone}>
                  {zone}
                </option>
              ))}
            </select>

            <select
              value={birthHour}
              onChange={(event) => setBirthHour(event.target.value)}
              className="rounded-md border border-zinc-300 bg-white px-2 py-2 text-sm"
            >
              {hourOptions.map((hour) => (
                <option key={hour} value={hour}>
                  {hour}
                </option>
              ))}
            </select>

            <select
              value={birthMinute}
              onChange={(event) => setBirthMinute(event.target.value)}
              className="rounded-md border border-zinc-300 bg-white px-2 py-2 text-sm"
            >
              {minuteOptions.map((minute) => (
                <option key={minute} value={minute}>
                  {minute}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium text-zinc-700">Giới tính</p>
          <div className="flex items-center gap-4 text-sm text-zinc-700">
            <label className="inline-flex items-center gap-1.5">
              <input type="radio" checked={gender === "nam"} onChange={() => setGender("nam")} />
              Nam
            </label>
            <label className="inline-flex items-center gap-1.5">
              <input type="radio" checked={gender === "nu"} onChange={() => setGender("nu")} />
              Nữ
            </label>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <label className="space-y-1">
            <span className="text-sm font-medium text-zinc-700">Năm xem</span>
            <select
              value={viewYear}
              onChange={(event) => setViewYear(event.target.value)}
              className="w-full rounded-md border border-zinc-300 bg-white px-2 py-2 text-sm"
            >
              {["2026", "2027", "2028", "2029", "2030"].map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1">
            <span className="text-sm font-medium text-zinc-700">Tháng xem (Âm lịch)</span>
            <select
              value={viewLunarMonth}
              onChange={(event) => setViewLunarMonth(event.target.value)}
              className="w-full rounded-md border border-zinc-300 bg-white px-2 py-2 text-sm"
            >
              {monthOptions.map((month) => (
                <option key={month} value={month}>
                  Tháng {month}
                </option>
              ))}
            </select>
          </label>
        </div>

        <button
          type="button"
          className="h-10 w-full rounded-none bg-rose-600 text-sm font-semibold text-white uppercase transition hover:bg-rose-700"
          onClick={() => setSubmitted(true)}
        >
          Lập lá số
        </button>

        {submitted && (
          <div className="space-y-2 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
            {summary ? <p>{summary}</p> : <p>Vui lòng kiểm tra lại thông tin năm sinh.</p>}
            <Link href="/tu-vi" className="font-semibold underline underline-offset-2 hover:text-rose-600">
              Xem thêm bài viết tử vi
            </Link>
          </div>
        )}
      </div>
    </section>
  )
}
