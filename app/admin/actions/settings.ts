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
import { normalizeModerationText } from "@/lib/moderation"
import { normalizeKeyword, toKeywordLabel } from "@/lib/seo-keywords"
import {
  ensurePermission,
  getPlainTextFromHtml,
  resolveEditorialFromSubmitAction,
  uniqueCategorySlug,
  uniquePostSlug,
} from "@/app/admin/actions-helpers"

export async function updatePasswordMock() {
  await requireCmsUser()
  redirect("/admin?tab=settings-password&toast=password_mock_saved")
}

export async function createSubordinateAccount(formData: FormData) {
  const currentUser = await requireEditorInChiefUser()
  ensurePermission(canCreateSubordinateAccount(currentUser.role), "/admin?tab=settings-password&toast=account_create_failed")

  const email = String(formData.get("email") || "").trim().toLowerCase()
  const name = String(formData.get("name") || "").trim()
  const password = String(formData.get("password") || "")
  const role = String(formData.get("role") || "").trim() as UserRole

  if (!email || !name || !password || password.length < 8) {
    redirect("/admin?tab=settings-password&toast=account_create_failed")
  }

  if (!roleCanCreate(currentUser.role, role)) {
    redirect("/admin?tab=settings-password&toast=account_create_forbidden")
  }

  const existingUser = await prisma.user.findUnique({ where: { email }, select: { id: true } })
  if (existingUser) {
    redirect("/admin?tab=settings-password&toast=account_create_duplicated")
  }

  await prisma.user.create({
    data: {
      email,
      name,
      role,
      passwordHash: hashPassword(password),
    },
  })

  clearDataCache()
  redirect("/admin?tab=settings-password&toast=account_created")
}

export async function updateRolePermissions(formData: FormData) {
  const currentUser = await requireEditorInChiefUser()
  ensurePermission(canCreateSubordinateAccount(currentUser.role), "/admin?tab=settings-permissions&toast=permissions_update_failed")

  const role = String(formData.get("role") || "").trim() as UserRole
  if (!ALL_EDITABLE_ROLES.includes(role)) {
    redirect("/admin?tab=settings-permissions&toast=permissions_update_failed")
  }

  const selected = ALL_PERMISSION_ACTIONS.filter(
    (action) => formData.get(`perm_${action}`) === "on"
  ) as PermissionAction[]

  await prisma.$transaction([
    prisma.rolePermission.deleteMany({ where: { role } }),
    ...selected.map((action) =>
      prisma.rolePermission.create({ data: { role, action } })
    ),
  ])

  setRolePermissions(role, selected)

  revalidatePath("/admin")
  redirect("/admin?tab=settings-permissions&toast=permissions_updated")
}

export async function updateUserRole(formData: FormData) {
  const currentUser = await requireEditorInChiefUser()
  ensurePermission(canCreateSubordinateAccount(currentUser.role), "/admin?tab=settings-users&toast=user_role_update_failed")

  const userId = String(formData.get("userId") || "").trim()
  const newRole = String(formData.get("newRole") || "").trim() as UserRole

  if (!userId || !ALL_EDITABLE_ROLES.includes(newRole)) {
    redirect("/admin?tab=settings-users&toast=user_role_update_failed")
  }

  if (userId === currentUser.id) {
    redirect("/admin?tab=settings-users&toast=user_role_update_failed")
  }

  const target = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } })
  if (!target) {
    redirect("/admin?tab=settings-users&toast=user_role_update_failed")
  }

  await prisma.user.update({ where: { id: userId }, data: { role: newRole } })

  clearDataCache()
  redirect("/admin?tab=settings-users&toast=user_role_updated")
}

export async function deleteUser(formData: FormData) {
  const currentUser = await requireEditorInChiefUser()
  ensurePermission(canCreateSubordinateAccount(currentUser.role), "/admin?tab=settings-users&toast=user_delete_forbidden")

  const userId = String(formData.get("userId") || "").trim()
  if (!userId) {
    redirect("/admin?tab=settings-users&toast=user_delete_failed")
  }

  if (userId === currentUser.id) {
    redirect("/admin?tab=settings-users&toast=user_delete_forbidden")
  }

  const target = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } })
  if (!target) {
    redirect("/admin?tab=settings-users&toast=user_delete_failed")
  }

  if (target.role === "EDITOR_IN_CHIEF" && currentUser.role !== "ADMIN") {
    redirect("/admin?tab=settings-users&toast=user_delete_forbidden")
  }

  await prisma.user.delete({ where: { id: userId } })

  clearDataCache()
  redirect("/admin?tab=settings-users&toast=user_deleted")
}

export async function addForbiddenKeyword(formData: FormData) {
  const currentUser = await requireCmsUser()
  ensurePermission(can(currentUser.role, "moderate-comment"), "/admin?tab=settings-moderation&toast=forbidden_keyword_failed")

  const term = String(formData.get("term") || "").trim()
  if (!term) {
    redirect("/admin?tab=settings-moderation&toast=forbidden_keyword_failed")
  }

  const normalizedTerm = normalizeModerationText(term)
  if (!normalizedTerm) {
    redirect("/admin?tab=settings-moderation&toast=forbidden_keyword_failed")
  }

  await prisma.forbiddenKeyword.upsert({
    where: { normalizedTerm },
    create: {
      term,
      normalizedTerm,
    },
    update: {
      term,
    },
  })

  clearDataCache()
  revalidatePath("/admin")
  redirect("/admin?tab=settings-moderation&toast=forbidden_keyword_saved")
}

export async function deleteForbiddenKeyword(formData: FormData) {
  const currentUser = await requireCmsUser()
  ensurePermission(can(currentUser.role, "moderate-comment"), "/admin?tab=settings-moderation&toast=forbidden_keyword_failed")

  const forbiddenKeywordId = String(formData.get("forbiddenKeywordId") || "").trim()
  if (!forbiddenKeywordId) {
    redirect("/admin?tab=settings-moderation&toast=forbidden_keyword_failed")
  }

  await prisma.forbiddenKeyword.delete({ where: { id: forbiddenKeywordId } })

  clearDataCache()
  revalidatePath("/admin")
  redirect("/admin?tab=settings-moderation&toast=forbidden_keyword_deleted")
}

export async function addSeoKeyword(formData: FormData) {
  const currentUser = await requireCmsUser()
  ensurePermission(can(currentUser.role, "create-post"), "/admin?tab=settings-moderation&toast=seo_keyword_failed")

  const keywordInput = String(formData.get("keyword") || "")
  const keyword = toKeywordLabel(keywordInput)
  if (!keyword) {
    redirect("/admin?tab=settings-moderation&toast=seo_keyword_failed")
  }

  const normalizedKeyword = normalizeKeyword(keyword)
  await prisma.seoKeyword.upsert({
    where: { normalizedKeyword },
    create: {
      keyword,
      normalizedKeyword,
    },
    update: {
      keyword,
    },
  })

  clearDataCache()
  revalidatePath("/admin")
  redirect("/admin?tab=settings-moderation&toast=seo_keyword_saved")
}

export async function deleteSeoKeyword(formData: FormData) {
  const currentUser = await requireCmsUser()
  ensurePermission(can(currentUser.role, "create-post"), "/admin?tab=settings-moderation&toast=seo_keyword_failed")

  const seoKeywordId = String(formData.get("seoKeywordId") || "").trim()
  if (!seoKeywordId) {
    redirect("/admin?tab=settings-moderation&toast=seo_keyword_failed")
  }

  await prisma.seoKeyword.delete({ where: { id: seoKeywordId } })

  clearDataCache()
  revalidatePath("/admin")
  redirect("/admin?tab=settings-moderation&toast=seo_keyword_deleted")
}
