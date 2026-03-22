"use client"

import { usePathname, useSearchParams } from "next/navigation"
import { useEffect } from "react"

export function ScrollToTopOnRouteChange() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const searchKey = searchParams.toString()

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" })
  }, [pathname, searchKey])

  return null
}
