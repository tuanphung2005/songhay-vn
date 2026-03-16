"use client"

import { useEffect } from "react"

type ViewTrackerProps = {
  postId: string
}

const VIEW_LOCK_PREFIX = "songhay:viewed-post:"

export function ViewTracker({ postId }: ViewTrackerProps) {
  useEffect(() => {
    const lockKey = `${VIEW_LOCK_PREFIX}${postId}`

    try {
      if (window.sessionStorage.getItem(lockKey) === "1") {
        return
      }
      // Set lock before sending request to avoid duplicate hits in Strict Mode/dev remounts.
      window.sessionStorage.setItem(lockKey, "1")
    } catch {
      // Ignore storage errors and continue with API request.
    }

    void fetch(`/api/posts/${postId}/view`, { method: "POST" })
  }, [postId])

  return null
}
