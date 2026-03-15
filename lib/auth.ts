import { createHmac } from "node:crypto"

import type { UserRole } from "@prisma/client"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"

import { prisma } from "@/lib/prisma"
import { hashPassword, verifyPassword } from "@/lib/password"

const SESSION_COOKIE_NAME = "songhay_session"
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7

type SessionPayload = {
  userId: string
  role: UserRole
  exp: number
}

function getSessionSecret() {
  return process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "songhay-dev-secret-change-me"
}

function toBase64Url(value: string) {
  return Buffer.from(value, "utf8").toString("base64url")
}

function fromBase64Url(value: string) {
  return Buffer.from(value, "base64url").toString("utf8")
}

function signData(data: string) {
  return createHmac("sha256", getSessionSecret()).update(data).digest("base64url")
}

export function encodeSession(payload: Omit<SessionPayload, "exp">, ttlSeconds = SESSION_TTL_SECONDS) {
  const fullPayload: SessionPayload = {
    ...payload,
    exp: Math.floor(Date.now() / 1000) + ttlSeconds,
  }
  const data = toBase64Url(JSON.stringify(fullPayload))
  const signature = signData(data)
  return `${data}.${signature}`
}

export function decodeSession(token: string | undefined | null): SessionPayload | null {
  if (!token) {
    return null
  }

  const [data, signature] = token.split(".")

  if (!data || !signature) {
    return null
  }

  const expected = signData(data)
  if (expected !== signature) {
    return null
  }

  try {
    const payload = JSON.parse(fromBase64Url(data)) as SessionPayload

    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) {
      return null
    }

    return payload
  } catch {
    return null
  }
}

export async function setSessionCookie(userId: string, role: UserRole) {
  const token = encodeSession({ userId, role })
  const cookieStore = await cookies()

  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
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
    redirect("/login")
  }

  if (user.role !== "ADMIN") {
    redirect("/")
  }

  return user
}

export const authCookieName = SESSION_COOKIE_NAME
