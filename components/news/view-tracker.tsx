"use client"

import { useEffect } from "react"

type ViewTrackerProps = {
  postId: string
}

export function ViewTracker({ postId }: ViewTrackerProps) {
  useEffect(() => {
    void fetch(`/api/posts/${postId}/view`, { method: "POST" })

    const startedAt = Date.now()
    let sent = false

    function sendEngagement() {
      if (sent) {
        return
      }

      sent = true
      const dwellSeconds = Math.max(1, Math.round((Date.now() - startedAt) / 1000))
      const payload = JSON.stringify({ dwellSeconds: Math.min(dwellSeconds, 1800) })
      const endpoint = `/api/posts/${postId}/engagement`

      if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
        const blob = new Blob([payload], { type: "application/json" })
        navigator.sendBeacon(endpoint, blob)
        return
      }

      void fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload,
        keepalive: true,
      })
    }

    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        sendEngagement()
      }
    }

    window.addEventListener("pagehide", sendEngagement)
    document.addEventListener("visibilitychange", onVisibilityChange)

    return () => {
      sendEngagement()
      window.removeEventListener("pagehide", sendEngagement)
      document.removeEventListener("visibilitychange", onVisibilityChange)
    }
  }, [postId])

  return null
}
