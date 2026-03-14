export type BmiResult = {
  bmi: number
  category: string
}

export function calculateBmi(heightCm: number, weightKg: number): BmiResult {
  const heightM = heightCm / 100
  const bmi = weightKg / (heightM * heightM)

  if (bmi < 18.5) {
    return { bmi, category: "Thiếu cân" }
  }

  if (bmi < 25) {
    return { bmi, category: "Bình thường" }
  }

  if (bmi < 30) {
    return { bmi, category: "Thừa cân" }
  }

  return { bmi, category: "Béo phì" }
}
