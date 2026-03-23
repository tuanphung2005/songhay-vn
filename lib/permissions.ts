import type { EditorialStatus, UserRole } from "@/generated/prisma/client"

export const ROLE_LABELS_VI: Record<UserRole, string> = {
  ADMIN: "Quản trị (cũ)",
  USER: "Biên tập viên (cũ)",
  EDITOR_IN_CHIEF: "Tổng biên tập",
  MANAGING_EDITOR: "Thư ký biên tập",
  TEAM_LEAD: "Trưởng nhóm",
  REPORTER_TRANSLATOR: "Phóng viên/Biên dịch",
  CONTRIBUTOR: "Cộng tác viên",
}

type PermissionAction =
  | "create-category"
  | "edit-category"
  | "delete-category"
  | "moderate-comment"
  | "create-post"
  | "edit-pending-review"
  | "submit-pending-review"
  | "submit-pending-publish"
  | "approve-pending-review"
  | "publish-pending-publish"
  | "edit-pending-publish"
  | "edit-published"
  | "view-all-posts"
  | "delete-any-media"
  | "create-subordinate-account"

const PERMISSIONS: Record<UserRole, Set<PermissionAction>> = {
  ADMIN: new Set([
    "create-category",
    "edit-category",
    "delete-category",
    "moderate-comment",
    "create-post",
    "edit-pending-review",
    "submit-pending-review",
    "submit-pending-publish",
    "approve-pending-review",
    "publish-pending-publish",
    "edit-pending-publish",
    "edit-published",
    "view-all-posts",
    "delete-any-media",
    "create-subordinate-account",
  ]),
  USER: new Set([
    "create-post",
    "edit-pending-review",
    "submit-pending-review",
    "view-all-posts",
  ]),
  EDITOR_IN_CHIEF: new Set([
    "create-category",
    "edit-category",
    "delete-category",
    "moderate-comment",
    "create-post",
    "edit-pending-review",
    "submit-pending-review",
    "submit-pending-publish",
    "approve-pending-review",
    "publish-pending-publish",
    "edit-pending-publish",
    "edit-published",
    "view-all-posts",
    "delete-any-media",
    "create-subordinate-account",
  ]),
  MANAGING_EDITOR: new Set([
    "create-category",
    "edit-category",
    "delete-category",
    "moderate-comment",
    "create-post",
    "edit-pending-review",
    "submit-pending-review",
    "submit-pending-publish",
    "approve-pending-review",
    "publish-pending-publish",
    "edit-pending-publish",
    "edit-published",
    "view-all-posts",
    "delete-any-media",
  ]),
  TEAM_LEAD: new Set([
    "create-post",
    "edit-pending-review",
    "submit-pending-review",
    "submit-pending-publish",
    "view-all-posts",
  ]),
  REPORTER_TRANSLATOR: new Set([
    "create-post",
    "edit-pending-review",
    "submit-pending-review",
    "view-all-posts",
  ]),
  CONTRIBUTOR: new Set([
    "create-post",
    "submit-pending-review",
    "edit-pending-review",
  ]),
}

export function can(role: UserRole, action: PermissionAction) {
  return PERMISSIONS[role].has(action)
}

export function canViewAllPosts(role: UserRole) {
  return can(role, "view-all-posts")
}

export function canPublishNow(role: UserRole) {
  return can(role, "publish-pending-publish")
}

export function canApprovePendingReview(role: UserRole) {
  return can(role, "approve-pending-review")
}

export function canSubmitPendingPublish(role: UserRole) {
  return can(role, "submit-pending-publish")
}

export function canEditByStatus(role: UserRole, status: EditorialStatus) {
  if (status === "DRAFT" || status === "REJECTED" || status === "PENDING_REVIEW") {
    return can(role, "edit-pending-review")
  }

  if (status === "PENDING_PUBLISH") {
    return can(role, "edit-pending-publish")
  }

  return can(role, "edit-published")
}

export function canDeleteAnyMedia(role: UserRole) {
  return can(role, "delete-any-media")
}

export function canCreateSubordinateAccount(role: UserRole) {
  return can(role, "create-subordinate-account")
}

export function roleCanCreate(role: UserRole, createdRole: UserRole) {
  if (!canCreateSubordinateAccount(role)) {
    return false
  }

  return createdRole !== "EDITOR_IN_CHIEF"
}

export function getAllowedSubmitActions(role: UserRole) {
  const actions: Array<"save-draft" | "submit-review" | "submit-publish" | "publish"> = [
    "save-draft",
    "submit-review",
  ]

  if (canSubmitPendingPublish(role)) {
    actions.push("submit-publish")
  }

  if (canPublishNow(role)) {
    actions.push("publish")
  }

  return actions
}
