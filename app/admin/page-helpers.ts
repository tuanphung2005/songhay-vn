import type { LucideIcon } from "lucide-react"
import {
  FolderKanban,
  KeyRound,
  LayoutDashboard,
  LibraryBig,
  MessageSquareMore,
  Newspaper,
  PenSquare,
  Trash2,
  UserSquare2,
} from "lucide-react"

import type { AdminTab } from "@/app/admin/data"

export type NavLeaf = {
  key: AdminTab
  label: string
  description: string
  icon: LucideIcon
  adminOnly?: boolean
}

export const OVERVIEW_TAB: NavLeaf = {
  key: "overview",
  label: "Tổng quan",
  description: "Bức tranh tổng quan trạng thái CMS",
  icon: LayoutDashboard,
}

export const CONTENT_MANAGEMENT_TABS: NavLeaf[] = [
  { key: "write", label: "Viết bài mới", description: "Soạn nội dung và gửi duyệt/xuất bản", icon: PenSquare },
  { key: "media-library", label: "Kho dữ liệu", description: "Tái sử dụng ảnh/video đã upload", icon: LibraryBig },
  { key: "personal-archive", label: "Lưu trữ cá nhân", description: "Bài viết theo tài khoản đăng nhập", icon: UserSquare2 },
  { key: "posts", label: "Kho bài", description: "Tổng hợp bài viết theo trạng thái biên tập", icon: Newspaper },
  { key: "trash", label: "Thùng rác", description: "Khôi phục hoặc xóa vĩnh viễn", icon: Trash2 },
]

export const SETTINGS_TABS: NavLeaf[] = [
  { key: "settings-password", label: "Đổi mật khẩu", description: "Mock UI đổi mật khẩu", icon: KeyRound },
  { key: "categories", label: "Chuyên mục", description: "Quản lý cấu trúc chuyên mục", icon: FolderKanban, adminOnly: true },
  { key: "comments", label: "Bình luận", description: "Duyệt và kiểm soát thảo luận", icon: MessageSquareMore, adminOnly: true },
]

type RawSearchParams = {
  tab?: string
  moved?: string
  direction?: string
  postsQ?: string
  postsAuthor?: string
  postsStatus?: string
  postsApproval?: string
  postsFrom?: string
  postsTo?: string
  postsPage?: string
  personalQ?: string
  personalStatus?: string
  personalFrom?: string
  personalTo?: string
  personalPage?: string
  trashQ?: string
  trashAuthor?: string
  trashFrom?: string
  trashTo?: string
  trashPage?: string
}

export function getVisibleTabs({
  canManageSettings,
}: {
  canManageSettings: boolean
}) {
  const contentTabs = CONTENT_MANAGEMENT_TABS.filter((item) => {
    if (item.key === "posts" || item.key === "trash" || item.key === "personal-archive") {
      return true
    }

    return item.adminOnly ? canManageSettings : true
  })

  const settingsTabs = SETTINGS_TABS.filter((item) => (item.adminOnly ? canManageSettings : true))

  return {
    contentTabs,
    settingsTabs,
    visibleTabs: [OVERVIEW_TAB, ...contentTabs, ...settingsTabs] as NavLeaf[],
  }
}

export function parseAdminSearchParams(resolvedSearchParams?: RawSearchParams) {
  const tabFromQuery = resolvedSearchParams?.tab
  const movedCategoryId = resolvedSearchParams?.moved
  const movedDirection = resolvedSearchParams?.direction

  const postsQuery = (resolvedSearchParams?.postsQ || "").trim().slice(0, 120)
  const postsAuthorRaw = (resolvedSearchParams?.postsAuthor || "").trim()
  const postsAuthor = postsAuthorRaw === "all" ? "" : postsAuthorRaw
  const postsStatus = ["all", "draft", "pending-review", "pending-publish", "published", "rejected"].includes(resolvedSearchParams?.postsStatus || "")
    ? (resolvedSearchParams?.postsStatus as "all" | "draft" | "pending-review" | "pending-publish" | "published" | "rejected")
    : "all"
  const postsApproval = ["all", "approved", "unapproved"].includes(resolvedSearchParams?.postsApproval || "")
    ? (resolvedSearchParams?.postsApproval as "all" | "approved" | "unapproved")
    : "all"
  const postsFrom = (resolvedSearchParams?.postsFrom || "").trim()
  const postsTo = (resolvedSearchParams?.postsTo || "").trim()
  const rawPostsPage = Number.parseInt(resolvedSearchParams?.postsPage || "1", 10)
  const requestedPostsPage = Number.isFinite(rawPostsPage) && rawPostsPage > 0 ? rawPostsPage : 1

  const personalQuery = (resolvedSearchParams?.personalQ || "").trim().slice(0, 120)
  const personalStatus = ["all", "draft", "pending", "pending-publish", "published", "rejected"].includes(resolvedSearchParams?.personalStatus || "")
    ? (resolvedSearchParams?.personalStatus as "all" | "draft" | "pending" | "pending-publish" | "published" | "rejected")
    : "all"
  const personalFrom = (resolvedSearchParams?.personalFrom || "").trim()
  const personalTo = (resolvedSearchParams?.personalTo || "").trim()
  const rawPersonalPage = Number.parseInt(resolvedSearchParams?.personalPage || "1", 10)
  const requestedPersonalPage = Number.isFinite(rawPersonalPage) && rawPersonalPage > 0 ? rawPersonalPage : 1

  const trashQuery = (resolvedSearchParams?.trashQ || "").trim().slice(0, 120)
  const trashAuthorRaw = (resolvedSearchParams?.trashAuthor || "").trim()
  const trashAuthor = trashAuthorRaw === "all" ? "" : trashAuthorRaw
  const trashFrom = (resolvedSearchParams?.trashFrom || "").trim()
  const trashTo = (resolvedSearchParams?.trashTo || "").trim()
  const rawTrashPage = Number.parseInt(resolvedSearchParams?.trashPage || "1", 10)
  const requestedTrashPage = Number.isFinite(rawTrashPage) && rawTrashPage > 0 ? rawTrashPage : 1

  return {
    tabFromQuery,
    movedCategoryId,
    movedDirection,
    postsFilters: {
      query: postsQuery,
      authorId: postsAuthor,
      status: postsStatus,
      approval: postsApproval,
      fromDate: postsFrom,
      toDate: postsTo,
      requestedPage: requestedPostsPage,
    } as const,
    personalArchiveFilters: {
      query: personalQuery,
      status: personalStatus,
      fromDate: personalFrom,
      toDate: personalTo,
      requestedPage: requestedPersonalPage,
    } as const,
    trashFilters: {
      query: trashQuery,
      authorId: trashAuthor,
      fromDate: trashFrom,
      toDate: trashTo,
      requestedPage: requestedTrashPage,
    } as const,
  }
}
