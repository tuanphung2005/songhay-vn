"use client"

import { useMemo, useState } from "react"

import { Button } from "@/components/ui/button"
import { calculateBmi, type BmiGender } from "@/lib/bmi"

export function BmiWidget() {
  const [gender, setGender] = useState<BmiGender>("male")
  const [height, setHeight] = useState("")
  const [weight, setWeight] = useState("")
  const [submitted, setSubmitted] = useState(false)

  const result = useMemo(() => {
    const h = Number(height)
    const w = Number(weight)

    if (!h || !w || h <= 0 || w <= 0) {
      return null
    }

    return calculateBmi(h, w, gender)
  }, [gender, height, weight])

  return (
    <section className="space-y-4 rounded-xl border border-zinc-200 bg-white p-4">
      <h3 className="text-xl font-bold text-zinc-900">Máy tính BMI</h3>

      <div className="space-y-3">
        <label className="block text-sm font-medium text-zinc-700">
          Giới tính
          <select
            value={gender}
            onChange={(event) => setGender(event.target.value as BmiGender)}
            className="mt-1 w-full border border-zinc-300 px-3 py-2"
          >
            <option value="male">Nam</option>
            <option value="female">Nữ</option>
          </select>
        </label>

        <label className="block text-sm font-medium text-zinc-700">
          Chiều cao (cm)
          <input
            value={height}
            onChange={(event) => setHeight(event.target.value)}
            type="number"
            min="1"
            className="mt-1 w-full border border-zinc-300 px-3 py-2"
            placeholder="Ví dụ: 165"
          />
        </label>

        <label className="block text-sm font-medium text-zinc-700">
          Cân nặng (kg)
          <input
            value={weight}
            onChange={(event) => setWeight(event.target.value)}
            type="number"
            min="1"
            className="mt-1 w-full border border-zinc-300 px-3 py-2"
            placeholder="Ví dụ: 58"
          />
        </label>
      </div>

      <Button
        type="button"
        className="h-10 w-full rounded-none bg-rose-600 text-white hover:bg-rose-700"
        onClick={() => setSubmitted(true)}
      >
        Xem
      </Button>

      {submitted && (
        <div className="border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {result ? (
            <p>
              BMI ({result.genderLabel}): <strong>{result.bmi.toFixed(1)}</strong> - {result.category}
            </p>
          ) : (
            <p>Vui lòng nhập chiều cao và cân nặng hợp lệ.</p>
          )}
        </div>
      )}
    </section>
  )
}
