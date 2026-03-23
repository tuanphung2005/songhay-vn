import type { UserRole } from "@/generated/prisma/client"

export type AdminTab =
  | "overview"
  | "write"
  | "media-library"
  | "personal-archive"
  | "categories"
  | "comments"
  | "posts"
  | "trash"
  | "settings-password"

export type PostsFilters = {
  query: string
  authorId: string
  status: "all" | "draft" | "pending-review" | "pending-publish" | "published" | "rejected"
  approval: "all" | "approved" | "unapproved"
  fromDate: string
  toDate: string
  requestedPage: number
}

export type PersonalArchiveFilters = {
  query: string
  status: "all" | "draft" | "pending" | "pending-publish" | "published" | "rejected"
  fromDate: string
  toDate: string
  requestedPage: number
}

export type TrashFilters = {
  query: string
  authorId: string
  fromDate: string
  toDate: string
  requestedPage: number
}

export type AdminCurrentUser = {
  id: string
  role: UserRole
}

export type GetAdminPageDataInput = {
  activeTab: AdminTab
  postsFilters: PostsFilters
  personalArchiveFilters: PersonalArchiveFilters
  trashFilters: TrashFilters
  currentUser: AdminCurrentUser
}
