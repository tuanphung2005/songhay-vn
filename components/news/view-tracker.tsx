"use client"

import { useEffect } from "react"

type ViewTrackerProps = {
  postId: string
}

export function ViewTracker({ postId }: ViewTrackerProps) {
  useEffect(() => {
    // Send view increment request on every mount (non-unique).
    void fetch(`/api/posts/${postId}/view`, { method: "POST" })
  }, [postId])

  return null
}
