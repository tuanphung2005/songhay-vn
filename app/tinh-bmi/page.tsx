import type { Metadata } from "next"

import { BmiWidget } from "@/components/news/bmi-widget"
import { SiteFooter } from "@/components/news/site-footer"
import { SiteHeader } from "@/components/news/site-header"

export const metadata: Metadata = {
  title: "Tính BMI",
  description: "Công cụ tính chỉ số BMI theo chiều cao và cân nặng.",
  alternates: {
    canonical: "/tinh-bmi",
  },
}

export default function BmiPage() {
  return (
    <div className="min-h-screen bg-white">
      <SiteHeader />
      <main className="mx-auto w-full max-w-4xl space-y-6 px-4 py-8 md:px-6">
        <h1 className="text-3xl font-black text-zinc-900">Tính BMI</h1>
        <BmiWidget />
      </main>
      <SiteFooter />
    </div>
  )
}
