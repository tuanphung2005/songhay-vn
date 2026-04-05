"use client"

import { useEffect } from "react"

export function EditFormDirtyTracker() {
  useEffect(() => {
    let isDirty = false

    const handleMarkDirty = () => {
      isDirty = true
    }

    const handleFormSubmit = () => {
      isDirty = false
    }

    const form = document.querySelector("form")
    if (form) {
      // Use capture true to catch all input/change events even if they stop propagation
      form.addEventListener("input", handleMarkDirty, true)
      form.addEventListener("change", handleMarkDirty, true)
      form.addEventListener("submit", handleFormSubmit)
    }

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault()
        e.returnValue = ""
      }
    }

    const handleGlobalClick = (e: MouseEvent) => {
      if (!isDirty) return
      
      const target = e.target as HTMLElement
      const link = target.closest("a")
      
      // Prevent soft navigation via Next.js <Link> if dirty
      if (link && link.href && link.target !== "_blank") {
        if (!window.confirm("Bạn có nội dung chưa lưu. Bạn có chắc chắn muốn rời đi?")) {
           e.preventDefault()
           e.stopPropagation()
        }
      }
    }

    window.addEventListener("beforeunload", handleBeforeUnload)
    document.addEventListener("click", handleGlobalClick, { capture: true })

    return () => {
      if (form) {
        form.removeEventListener("input", handleMarkDirty, true)
        form.removeEventListener("change", handleMarkDirty, true)
        form.removeEventListener("submit", handleFormSubmit)
      }
      window.removeEventListener("beforeunload", handleBeforeUnload)
      document.removeEventListener("click", handleGlobalClick, { capture: true })
    }
  }, [])

  return null
}
