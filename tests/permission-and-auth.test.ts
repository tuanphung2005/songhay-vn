import { describe, expect, test } from "bun:test"
import { readFileSync } from "node:fs"
import { join } from "node:path"

import { decodeSession, encodeSession } from "../lib/auth"

function readWorkspaceFile(relativePath: string) {
  return readFileSync(join(process.cwd(), relativePath), "utf8")
}

// ── Session crypto round-trip ────────────────────────────────────────────────

describe("session encoding / decoding", () => {
  test("encodes and decodes a valid session round-trip", () => {
    const token = encodeSession({ userId: "user-abc", role: "USER" })
    const decoded = decodeSession(token)

    expect(decoded).not.toBeNull()
    expect(decoded?.userId).toBe("user-abc")
    expect(decoded?.role).toBe("USER")
  })

  test("decodes ADMIN role correctly", () => {
    const token = encodeSession({ userId: "admin-xyz", role: "ADMIN" })
    const decoded = decodeSession(token)

    expect(decoded?.role).toBe("ADMIN")
    expect(decoded?.userId).toBe("admin-xyz")
  })

  test("returns null for a tampered token (signature mismatch)", () => {
    const token = encodeSession({ userId: "user-abc", role: "USER" })
    const [data] = token.split(".")
    const tampered = `${data}.invalidsig`

    expect(decodeSession(tampered)).toBeNull()
  })

  test("returns null for an expired session", () => {
    // TTL of -1 second → already expired
    const token = encodeSession({ userId: "user-abc", role: "USER" }, -1)
    expect(decodeSession(token)).toBeNull()
  })

  test("returns null for an empty / undefined token", () => {
    expect(decodeSession(undefined)).toBeNull()
    expect(decodeSession(null)).toBeNull()
    expect(decodeSession("")).toBeNull()
  })

  test("returns null for a token without period separator", () => {
    expect(decodeSession("nodottoken")).toBeNull()
  })

  test("returns null for a token with valid structure but garbage payload", () => {
    // base64url-encode some non-JSON garbage
    const garbage = Buffer.from("not-json!!!").toString("base64url")
    const result = decodeSession(`${garbage}.whatever`)
    expect(result).toBeNull()
  })
})

// ── Auth guard source assertions ─────────────────────────────────────────────

describe("auth guard source checks", () => {
  test("requireAdminUser redirects to / when user role is USER", () => {
    const source = readWorkspaceFile("lib/auth.ts")

    // Non-admin → redirect home
    expect(source).toContain("if (user.role !== \"ADMIN\")")
    expect(source).toContain("redirect(\"/\")")
  })

  test("requireCmsUser redirects to login when no session", () => {
    const source = readWorkspaceFile("lib/auth.ts")

    // Unauthenticated → redirect to login
    expect(source).toContain("redirect(\"/login?admin=1\")")
    expect(source).toContain("export async function requireCmsUser")
    expect(source).toContain("export async function requireAdminUser")
  })

  test("admin-only actions use requireAdminUser not requireCmsUser", () => {
    const source = readWorkspaceFile("app/admin/actions.ts")

    // These must be admin-gated
    expect(source).toMatch(/export async function approvePendingPost[\s\S]*?requireAdminUser/)
    expect(source).toMatch(/export async function rejectPendingPost[\s\S]*?requireAdminUser/)
    expect(source).toMatch(/export async function createCategory[\s\S]*?requireAdminUser/)
    expect(source).toMatch(/export async function updateCategory[\s\S]*?requireAdminUser/)
    expect(source).toMatch(/export async function deleteCategory[\s\S]*?requireAdminUser/)
  })

  test("non-admin actions use requireCmsUser (any authenticated CMS user)", () => {
    const source = readWorkspaceFile("app/admin/actions.ts")

    // These should be available to all CMS users (editor + admin)
    expect(source).toMatch(/export async function createPost[\s\S]*?requireCmsUser/)
    expect(source).toMatch(/export async function movePostToTrash[\s\S]*?requireCmsUser/)
    expect(source).toMatch(/export async function restorePostFromTrash[\s\S]*?requireCmsUser/)
  })

  test("session cookie is httpOnly and uses lax sameSite", () => {
    const source = readWorkspaceFile("lib/auth.ts")

    expect(source).toContain("httpOnly: true")
    expect(source).toContain("sameSite: \"lax\"")
    // Only secure in production
    expect(source).toContain("secure: process.env.NODE_ENV === \"production\"")
  })
})
