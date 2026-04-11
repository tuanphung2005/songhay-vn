import type { BmiGender, BmiResult } from "@/types/health"

export type { BmiGender, BmiResult }

export function calculateBmi(heightCm: number, weightKg: number, gender: BmiGender): BmiResult {
  const heightM = heightCm / 100
  const bmi = weightKg / (heightM * heightM)

  const genderLabel = gender === "male" ? "Nam" : "Nữ"
  const underweight = gender === "male" ? 20 : 19
  const normalUpper = gender === "male" ? 25 : 24
  const overweightUpper = gender === "male" ? 30 : 29

  if (bmi < underweight) {
    return { bmi, category: "Thiếu cân", genderLabel }
  }

  if (bmi < normalUpper) {
    return { bmi, category: "Bình thường", genderLabel }
  }

  if (bmi < overweightUpper) {
    return { bmi, category: "Thừa cân", genderLabel }
  }

  return { bmi, category: "Béo phì", genderLabel }
}
