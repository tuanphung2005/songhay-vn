"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { MediaAssetType, type UserRole } from "@/generated/prisma/client"

import { requireAdminUser, requireCmsUser, requireEditorInChiefUser } from "@/lib/auth"
import { uploadImageToCloudinary, uploadVideoToCloudinary, uploadThumbnail } from "@/lib/cloudinary"
import { clearDataCache } from "@/lib/data-cache"
import {
  can,
  canApprovePendingReview,
  canCreateSubordinateAccount,
  canPublishNow,
  canViewAllPosts,
  roleCanCreate,
  ALL_EDITABLE_ROLES,
  ALL_PERMISSION_ACTIONS,
  setRolePermissions,
  type PermissionAction,
} from "@/lib/permissions"
import { prisma } from "@/lib/prisma"
import { hashPassword } from "@/lib/password"
import {
  ensurePermission,
  getPlainTextFromHtml,
  resolveEditorialFromSubmitAction,
  uniqueCategorySlug,
  uniquePostSlug,
} from "@/app/admin/actions-helpers"

export async function moderateComment(formData: FormData) {
  const currentUser = await requireCmsUser()
  ensurePermission(can(currentUser.role, "moderate-comment"), "/admin?tab=comments&toast=post_action_forbidden")

  const commentId = String(formData.get("commentId") || "")
  const action = String(formData.get("action") || "")

  if (!commentId || !["approve", "delete"].includes(action)) {
    redirect("/admin?tab=comments&toast=comment_action_failed")
  }

  if (action === "approve") {
    await prisma.comment.update({ where: { id: commentId }, data: { isApproved: true } })
  }

  if (action === "delete") {
    await prisma.comment.delete({ where: { id: commentId } })
  }

  revalidatePath("/admin")
  clearDataCache()
  redirect(`/admin?tab=comments&toast=${action === "approve" ? "comment_approved" : "comment_deleted"}`)
}
