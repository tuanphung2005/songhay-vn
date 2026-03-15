"use client"

import { useMemo, useState } from "react"

import { Button } from "@/components/ui/button"

const stressAdjust: Record<string, number> = {
  low: -1,
  medium: 1,
  high: 3,
}

export function BioAgeWidget() {
  const [age, setAge] = useState("")
  const [sleepHours, setSleepHours] = useState("")
  const [activeMinutes, setActiveMinutes] = useState("")
  const [stressLevel, setStressLevel] = useState<"low" | "medium" | "high">("medium")
  const [submitted, setSubmitted] = useState(false)

  const estimate = useMemo(() => {
    const currentAge = Number(age)
    const sleep = Number(sleepHours)
    const activity = Number(activeMinutes)

    if (!currentAge || currentAge <= 0 || !sleep || sleep <= 0 || activity < 0) {
      return null
    }

    // Simple health-based estimate for editorial utility widgets.
    let bioAge = currentAge

    if (sleep < 6) {
      bioAge += 2
    } else if (sleep >= 7 && sleep <= 8.5) {
      bioAge -= 1
    }

    if (activity >= 150) {
      bioAge -= 1.5
    } else if (activity < 60) {
      bioAge += 1.5
    }

    bioAge += stressAdjust[stressLevel]

    return {
      value: Math.max(10, Number(bioAge.toFixed(1))),
      delta: Number((bioAge - currentAge).toFixed(1)),
    }
  }, [age, sleepHours, activeMinutes, stressLevel])

  return (
    <section className="space-y-4 rounded-xl border border-zinc-200 bg-white p-4">
      <h3 className="text-xl font-bold text-zinc-900">Tính tuổi sinh học</h3>

      <div className="space-y-3">
        <label className="block text-sm font-medium text-zinc-700">
          Tuổi hiện tại
          <input
            value={age}
            onChange={(event) => setAge(event.target.value)}
            type="number"
            min="1"
            className="mt-1 w-full border border-zinc-300 px-3 py-2"
            placeholder="Ví dụ: 30"
          />
        </label>

        <label className="block text-sm font-medium text-zinc-700">
          Giờ ngủ trung bình / ngày
          <input
            value={sleepHours}
            onChange={(event) => setSleepHours(event.target.value)}
            type="number"
            min="1"
            step="0.5"
            className="mt-1 w-full border border-zinc-300 px-3 py-2"
            placeholder="Ví dụ: 7.5"
          />
        </label>

        <label className="block text-sm font-medium text-zinc-700">
          Phút vận động / tuần
          <input
            value={activeMinutes}
            onChange={(event) => setActiveMinutes(event.target.value)}
            type="number"
            min="0"
            className="mt-1 w-full border border-zinc-300 px-3 py-2"
            placeholder="Ví dụ: 180"
          />
        </label>

        <label className="block text-sm font-medium text-zinc-700">
          Mức căng thẳng
          <select
            value={stressLevel}
            onChange={(event) => setStressLevel(event.target.value as "low" | "medium" | "high")}
            className="mt-1 w-full border border-zinc-300 px-3 py-2"
          >
            <option value="low">Thấp</option>
            <option value="medium">Trung bình</option>
            <option value="high">Cao</option>
          </select>
        </label>
      </div>

      <Button
        type="button"
        className="h-10 w-full rounded-none bg-rose-600 text-white hover:bg-rose-700"
        onClick={() => setSubmitted(true)}
      >
        Ước tính
      </Button>

      {submitted && (
        <div className="space-y-1 border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {estimate ? (
            <>
              <p>
                Tuổi sinh học ước tính: <strong>{estimate.value}</strong>
              </p>
              <p>
                Chênh lệch: <strong>{estimate.delta > 0 ? `+${estimate.delta}` : estimate.delta}</strong> tuổi so với hiện tại
              </p>
              <p className="text-xs text-zinc-600">Kết quả chỉ mang tính tham khảo.</p>
            </>
          ) : (
            <p>Vui lòng nhập đủ thông tin hợp lệ.</p>
          )}
        </div>
      )}
    </section>
  )
}
