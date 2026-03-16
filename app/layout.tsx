import type { Metadata } from "next"
import { Be_Vietnam_Pro, Merriweather } from "next/font/google"

import "./globals.css"
import { Toaster } from "@/components/ui/sonner"
import { cn } from "@/lib/utils"

const fontSans = Be_Vietnam_Pro({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-sans",
})

const fontSerif = Merriweather({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "700", "900"],
  variable: "--font-serif",
})

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://songhay.vn"

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Songhay.vn | Kho tàng điều hay",
    template: "%s | Songhay.vn",
  },
  description:
    "Songhay.vn - cổng thông tin phong cách sống Việt Nam với tin tức song hay, sống khỏe, mẹo hay, đời sống, góc stress, tử vi và video.",
  openGraph: {
    title: "Songhay.vn | Kho tàng điều hay",
    description:
      "Tin tức và tiện ích mỗi ngày: song hay, sống khỏe, mẹo hay, đời sống, góc stress, tử vi, video.",
    type: "website",
    url: siteUrl,
    siteName: "Songhay.vn",
    locale: "vi_VN",
  },
  twitter: {
    card: "summary_large_image",
    title: "Songhay.vn | Kho tàng điều hay",
    description:
      "Tin tức và tiện ích mỗi ngày: song hay, sống khỏe, mẹo hay, đời sống, góc stress, tử vi, video.",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="vi"
      suppressHydrationWarning
      className={cn("antialiased", fontSans.variable, fontSerif.variable)}
    >
      <body>
        {children}
        <Toaster />
      </body>
    </html>
  )
}
