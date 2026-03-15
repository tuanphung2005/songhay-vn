"use client"

import Link from "next/link"
import { useMemo, useState } from "react"

import { Button } from "@/components/ui/button"

const canList = ["Canh", "Tan", "Nham", "Quy", "Giap", "At", "Binh", "Dinh", "Mau", "Ky"]
const chiList = ["Than", "Dau", "Tuat", "Hoi", "Ty", "Suu", "Dan", "Mao", "Thin", "Ti", "Ngo", "Mui"]

export function TuViWidget() {
  const [birthYear, setBirthYear] = useState("")
  const [birthHour, setBirthHour] = useState("Ty")
  const [gender, setGender] = useState("nu")
  const [submitted, setSubmitted] = useState(false)

  const summary = useMemo(() => {
    const year = Number(birthYear)

    if (!year || year < 1900 || year > 2100) {
      return null
    }

    const can = canList[year % 10]
    const chi = chiList[year % 12]
    const tendency = gender === "nam" ? "đường công việc" : "đường tình cảm"

    return `${can} ${chi} - giờ ${birthHour}: tháng này thuận cho ${tendency}, nên ưu tiên kế hoạch rõ ràng trước quyết định lớn.`
  }, [birthYear, birthHour, gender])

  return (
    <section className="space-y-4 rounded-xl border border-zinc-200 bg-white p-4">
      <h3 className="text-xl font-bold text-zinc-900">Lập lá số tử vi</h3>

      <div className="space-y-3">
        <label className="block text-sm font-medium text-zinc-700">
          Năm sinh
          <input
            value={birthYear}
            onChange={(event) => setBirthYear(event.target.value)}
            type="number"
            min="1900"
            max="2100"
            className="mt-1 w-full border border-zinc-300 px-3 py-2"
            placeholder="Ví dụ: 1995"
          />
        </label>

        <label className="block text-sm font-medium text-zinc-700">
          Giờ sinh
          <select
            value={birthHour}
            onChange={(event) => setBirthHour(event.target.value)}
            className="mt-1 w-full border border-zinc-300 px-3 py-2"
          >
            {[
              "Ty",
              "Suu",
              "Dan",
              "Mao",
              "Thin",
              "Ti",
              "Ngo",
              "Mui",
              "Than",
              "Dau",
              "Tuat",
              "Hoi",
            ].map((hour) => (
              <option key={hour} value={hour}>
                {hour}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm font-medium text-zinc-700">
          Giới tính
          <select
            value={gender}
            onChange={(event) => setGender(event.target.value)}
            className="mt-1 w-full border border-zinc-300 px-3 py-2"
          >
            <option value="nu">Nữ</option>
            <option value="nam">Nam</option>
          </select>
        </label>
      </div>

      <Button
        type="button"
        className="h-10 w-full rounded-none bg-rose-600 text-white hover:bg-rose-700"
        onClick={() => setSubmitted(true)}
      >
        Lập lá số
      </Button>

      {submitted && (
        <div className="space-y-2 border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {summary ? <p>{summary}</p> : <p>Vui lòng nhập năm sinh hợp lệ.</p>}
          <Link href="/tu-vi" className="font-semibold underline underline-offset-2 hover:text-rose-600">
            Xem thêm bài viết tử vi
          </Link>
        </div>
      )}
    </section>
  )
}
