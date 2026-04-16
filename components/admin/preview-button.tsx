"use client"

import { Eye } from "lucide-react"
import { Button } from "@/components/ui/button"

interface PreviewButtonProps {
  postId: string
}

export function PreviewButton({ postId }: PreviewButtonProps) {
  function handleClick(e: React.MouseEvent<HTMLButtonElement>) {
    const penNameInput = document.getElementById("postPenName") as HTMLInputElement
    if (penNameInput && !penNameInput.value.trim()) {
      e.preventDefault()
      alert("Vui lòng nhập Bút danh trước khi Xem trước!")
      penNameInput.focus()
      return
    }
    window.open(`/admin/preview/${postId}`, "_blank", "noreferrer")
  }

  return (
    <Button type="button" variant="secondary" size="lg" onClick={handleClick}>
      <Eye className="size-4 mr-1.5" />
      Xem trước
    </Button>
  )
}
