import type { Metadata } from "next"
import { Be_Vietnam_Pro, Merriweather } from "next/font/google"

import "./globals.css"
import { JsonLd } from "@/components/seo/json-ld"
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
  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${siteUrl}#organization`,
    name: "Songhay.vn",
    url: siteUrl,
    logo: {
      "@type": "ImageObject",
      url: `${siteUrl}/placeholder-news.svg`,
    },
  }

  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${siteUrl}#website`,
    url: siteUrl,
    name: "Songhay.vn",
    publisher: {
      "@id": `${siteUrl}#organization`,
    },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${siteUrl}/?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  }

  return (
    <html
      lang="vi"
      suppressHydrationWarning
      className={cn("antialiased", fontSans.variable, fontSerif.variable)}
    >
      <body>
        <JsonLd data={[organizationJsonLd, websiteJsonLd]} />
        {children}
        <Toaster />
      </body>
    </html>
  )
}
