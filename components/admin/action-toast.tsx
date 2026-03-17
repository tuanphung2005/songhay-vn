"use client"

import { useEffect } from "react"
import { toast } from "sonner"

const TOAST_MESSAGES: Record<string, { title: string; description: string; type: "success" | "error" }> = {
  category_created: {
    title: "Đã tạo chuyên mục",
    description: "Chuyên mục mới đã được lưu thành công.",
    type: "success",
  },
  category_updated: {
    title: "Đã cập nhật chuyên mục",
    description: "Thông tin chuyên mục đã được cập nhật.",
    type: "success",
  },
  category_reordered: {
    title: "Đã cập nhật thứ tự",
    description: "Thứ tự chuyên mục đã được sắp xếp lại.",
    type: "success",
  },
  category_deleted: {
    title: "Đã xóa chuyên mục",
    description: "Chuyên mục đã được xóa an toàn.",
    type: "success",
  },
  category_delete_failed: {
    title: "Không thể xóa chuyên mục",
    description: "Vui lòng chọn chuyên mục đích để chuyển bài viết trước khi xóa.",
    type: "error",
  },
  category_reorder_failed: {
    title: "Không thể sắp xếp",
    description: "Thao tác sắp xếp không hợp lệ. Vui lòng thử lại.",
    type: "error",
  },
  post_created: {
    title: "Đăng bài thành công",
    description: "Bài viết đã được lưu và chuyển sang kho bài.",
    type: "success",
  },
}

export function AdminActionToast() {
  useEffect(() => {
    const url = new URL(window.location.href)
    const toastKey = url.searchParams.get("toast")
    if (!toastKey) {
      return
    }

    const message = TOAST_MESSAGES[toastKey]
    if (message) {
      if (message.type === "success") {
        toast.success(message.title, { description: message.description })
      } else {
        toast.error(message.title, { description: message.description })
      }
    }

    url.searchParams.delete("toast")
    url.searchParams.delete("moved")
    url.searchParams.delete("direction")
    window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`)
  }, [])

  return null
}
