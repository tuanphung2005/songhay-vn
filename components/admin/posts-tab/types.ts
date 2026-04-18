import type { EditorialStatus } from "@prisma/client"

export type PostRow = {
  id: string
  title: string
  penName: string | null
  excerpt: string
  seoTitle: string | null
  seoDescription: string | null
  seoKeywords: string | null
  slug: string
  views: number
  thumbnailUrl: string | null
  createdAt: Date
  updatedAt: Date
  publishedAt: Date | null
  approvedAt: Date | null
  scheduledPublishAt: Date | null
  isFeatured: boolean
  isTrending: boolean
  isPublished: boolean
  isDraft: boolean
  editorialStatus: EditorialStatus
  author: { id: string; name: string; email: string } | null
  approver: { id: string; name: string; email: string } | null
  lastEditor: { id: string; name: string; email: string } | null
  category: { name: string; slug: string }
}

export type PostsFilters = {
  query: string
  authorId: string
  status: "all" | "draft" | "pending-review" | "pending-publish" | "published" | "rejected"
  approval: "all" | "approved" | "unapproved"
  categoryId: string
  fromDate: string
  toDate: string
}

export type PostsData = {
  posts: PostRow[]
  totalCount: number
  totalPages: number
  currentPage: number
  filterOptions: {
    authors: Array<{ id: string; name: string; email: string }>
    categories: Array<{ id: string; name: string; slug: string }>
  }
}

export type PostActions = {
  movePostToTrash: (formData: FormData) => Promise<void>
  submitPostToPendingReview: (formData: FormData) => Promise<void>
  promotePostToPendingPublish: (formData: FormData) => Promise<void>
  approvePendingPost: (formData: FormData) => Promise<void>
  rejectPendingPost: (formData: FormData) => Promise<void>
  returnPostToDraft: (formData: FormData) => Promise<void>
  returnPostToPendingReview: (formData: FormData) => Promise<void>
  returnPostToPendingPublish: (formData: FormData) => Promise<void>
}

export type PostPermissions = {
  isAdmin: boolean
  canDeletePost: boolean
  currentUserId: string
  canSubmitPendingReview: boolean
  canSubmitPendingPublish: boolean
  canReviewPending: boolean
  canPublishNow: boolean
  canEditDraft: boolean
  canEditPendingReview: boolean
  canEditPendingPublish: boolean
  canEditPublished: boolean
}

export const STATUS_CONFIG: Record<
  EditorialStatus,
  { label: string; rowClass: string; badgeClass: string; dot: string }
> = {
  DRAFT: {
    label: "Nháp",
    rowClass: "",
    badgeClass: "bg-zinc-100 text-zinc-600 border-zinc-200",
    dot: "bg-zinc-400",
  },
  PENDING_REVIEW: {
    label: "Chờ duyệt",
    rowClass: "bg-amber-50/40",
    badgeClass: "bg-amber-50 text-amber-700 border-amber-200",
    dot: "bg-amber-500",
  },
  PENDING_PUBLISH: {
    label: "Chờ đăng",
    rowClass: "bg-sky-50/40",
    badgeClass: "bg-sky-50 text-sky-700 border-sky-200",
    dot: "bg-sky-500",
  },
  PUBLISHED: {
    label: "Đã đăng",
    rowClass: "bg-emerald-50/30",
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
    dot: "bg-emerald-500",
  },
  REJECTED: {
    label: "Từ chối",
    rowClass: "bg-rose-50/30",
    badgeClass: "bg-rose-50 text-rose-700 border-rose-200",
    dot: "bg-rose-500",
  },
}

export function buildPostsQuery(filters: PostsFilters, page: number) {
  return (
    `/admin?tab=posts` +
    (filters.query ? `&postsQ=${encodeURIComponent(filters.query)}` : "") +
    (filters.authorId ? `&postsAuthor=${encodeURIComponent(filters.authorId)}` : "") +
    (filters.status !== "all" ? `&postsStatus=${filters.status}` : "") +
    (filters.approval !== "all" ? `&postsApproval=${filters.approval}` : "") +
    (filters.categoryId ? `&postsCategory=${encodeURIComponent(filters.categoryId)}` : "") +
    (filters.fromDate ? `&postsFrom=${encodeURIComponent(filters.fromDate)}` : "") +
    (filters.toDate ? `&postsTo=${encodeURIComponent(filters.toDate)}` : "") +
    `&postsPage=${page}`
  )
}

export function canEditPost(
  post: Pick<PostRow, "editorialStatus">,
  perms: Pick<PostPermissions, "canEditDraft" | "canEditPendingReview" | "canEditPendingPublish" | "canEditPublished">
) {
  switch (post.editorialStatus) {
    case "DRAFT": return perms.canEditDraft
    case "PENDING_REVIEW": return perms.canEditPendingReview
    case "PENDING_PUBLISH": return perms.canEditPendingPublish
    default: return perms.canEditPublished
  }
}

export function getTimelineLabel(post: PostRow) {
  if (post.editorialStatus === "PENDING_PUBLISH" && post.scheduledPublishAt) {
    return `Hẹn ${new Date(post.scheduledPublishAt).toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    })}`
  }
  if (post.editorialStatus === "PUBLISHED" && post.publishedAt) {
    return `Đăng ${new Date(post.publishedAt).toLocaleDateString("vi-VN")}`
  }
  if (post.editorialStatus === "PENDING_PUBLISH" && post.approvedAt) {
    return `Duyệt ${new Date(post.approvedAt).toLocaleDateString("vi-VN")}`
  }
  return `Sửa ${new Date(post.updatedAt).toLocaleDateString("vi-VN")}`
}
