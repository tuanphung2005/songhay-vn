import type { UserRole } from "@/generated/prisma/client"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"

import { prisma } from "@/lib/prisma"
import {
  canCreateSubordinateAccount,
  canDeleteAnyMedia,
} from "@/lib/permissions"
import { decodeSession, encodeSession, sessionTtlSeconds } from "@/lib/session"

const SESSION_COOKIE_NAME = "songhay_session"
export { decodeSession, encodeSession } from "@/lib/session"

export async function setSessionCookie(userId: string, role: UserRole) {
  const token = encodeSession({ userId, role })
  const cookieStore = await cookies()

  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: sessionTtlSeconds,
  })
}

export async function clearSessionCookie() {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE_NAME)
}

export async function getCurrentSession() {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value
  return decodeSession(token)
}

export async function getCurrentUser() {
  const session = await getCurrentSession()

  if (!session) {
    return null
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, name: true, email: true, role: true },
  })

  if (!user) {
    return null
  }

  return user
}

export async function requireAdminUser() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login?admin=1")
  }

  const hasElevatedAccess =
    canDeleteAnyMedia(user.role) || canCreateSubordinateAccount(user.role)

  if (!hasElevatedAccess) {
    redirect("/")
  }

  return user
}

export async function requireEditorInChiefUser() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login?admin=1")
  }

  if (!canCreateSubordinateAccount(user.role)) {
    redirect("/")
  }

  return user
}

export async function requireCmsUser() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login?admin=1")
  }

  return user
}

export const authCookieName = SESSION_COOKIE_NAME
