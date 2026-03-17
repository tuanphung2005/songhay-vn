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
  post_submitted_review: {
    title: "Đã gửi chờ duyệt",
    description: "Bài viết của bạn đã vào kho chờ duyệt.",
    type: "success",
  },
  post_approved: {
    title: "Đã duyệt bài",
    description: "Bài viết đã được xuất bản.",
    type: "success",
  },
  post_rejected: {
    title: "Đã từ chối bài",
    description: "Bài viết đã được chuyển sang trạng thái từ chối.",
    type: "success",
  },
  media_uploaded: {
    title: "Đã tải media",
    description: "Media đã được lưu vào kho dữ liệu.",
    type: "success",
  },
  media_upload_failed: {
    title: "Upload thất bại",
    description: "Vui lòng kiểm tra định dạng hoặc dung lượng tệp.",
    type: "error",
  },
  media_deleted: {
    title: "Đã xóa media",
    description: "Media đã được xóa khỏi kho dữ liệu.",
    type: "success",
  },
  media_delete_failed: {
    title: "Xóa media thất bại",
    description: "Bạn không có quyền hoặc media không còn tồn tại.",
    type: "error",
  },
  password_mock_saved: {
    title: "Mock đổi mật khẩu",
    description: "Đã ghi nhận thao tác mock. Chưa có logic đổi mật khẩu thật.",
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
