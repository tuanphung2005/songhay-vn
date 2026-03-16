import type { Metadata } from "next"

import { BioAgeWidget } from "@/components/news/bio-age-widget"
import { SiteFooter } from "@/components/news/site-footer"
import { SiteHeader } from "@/components/news/site-header"

export const metadata: Metadata = {
  title: "Máy tính tuổi sinh học",
  description: "Ước tính tuổi sinh học dựa trên giấc ngủ, vận động và mức căng thẳng.",
  alternates: {
    canonical: "/tuoi-sinh-hoc",
  },
}

export default function BioAgePage() {
  return (
    <div className="min-h-screen bg-white">
      <SiteHeader />
      <main className="mx-auto w-full max-w-4xl space-y-6 px-4 py-8 md:px-6">
        <h1 className="text-3xl font-black text-zinc-900">Máy tính tuổi sinh học</h1>
        <BioAgeWidget />
      </main>
      <SiteFooter />
    </div>
  )
}
