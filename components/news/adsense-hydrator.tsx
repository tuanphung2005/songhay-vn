"use client"

import { usePathname } from "next/navigation"
import { useEffect } from "react"

declare global {
  interface Window {
    adsbygoogle?: unknown[]
  }
}

function requestPendingAds() {
  const slots = document.querySelectorAll<HTMLModElement>("ins.adsbygoogle")

  for (const slot of slots) {
    if (slot.getAttribute("data-adsbygoogle-status")) {
      continue
    }

    if (slot.getAttribute("data-adsense-requested") === "true") {
      continue
    }

    slot.setAttribute("data-adsense-requested", "true")

    try {
      ; (window.adsbygoogle = window.adsbygoogle || []).push({})
    } catch {
      slot.removeAttribute("data-adsense-requested")
    }
  }
}

export function AdsenseHydrator() {
  const pathname = usePathname()

  useEffect(() => {
    requestPendingAds()

    const retryTimer = window.setTimeout(() => {
      requestPendingAds()
    }, 1200)

    return () => {
      window.clearTimeout(retryTimer)
    }
  }, [pathname])

  return null
}
