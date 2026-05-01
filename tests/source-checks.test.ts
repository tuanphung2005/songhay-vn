import { describe, expect, test } from "bun:test"
import { readFileSync } from "node:fs"
import { join } from "node:path"

function readWorkspaceFile(relativePath: string) {
  return readFileSync(join(process.cwd(), relativePath), "utf8")
}

describe("Source Verification: Type Centralization", () => {
  test("lib/queries.ts uses centralized types", () => {
    const source = readWorkspaceFile("lib/queries.ts")
    expect(source).toContain('import type { PostListItem, PostFull, PostWithCategoryAndComments } from "@/types/post"')
    expect(source).toContain('import type { SearchResultItem } from "@/types/search"')
    expect(source).toContain('import type { CategoryWithChildren } from "@/types/category"')
    expect(source).toContain("export type { PostListItem, PostFull, SearchResultItem, CategoryWithChildren, PostWithCategoryAndComments }")
  })

  test("lib/session.ts uses centralized auth types", () => {
    const source = readWorkspaceFile("lib/session.ts")
    expect(source).toContain('import type { SessionPayload } from "@/types/auth"')
  })

  test("lib/bmi.ts uses centralized health types", () => {
    const source = readWorkspaceFile("lib/bmi.ts")
    expect(source).toContain('import type { BmiGender, BmiResult } from "@/types/health"')
    expect(source).toContain("export type { BmiGender, BmiResult }")
  })

  test("app/admin/data-types.ts re-exports from types/admin", () => {
    const source = readWorkspaceFile("app/admin/data-types.ts")
    expect(source).toContain('export * from "@/types/admin"')
  })
})

describe("Source Verification: Date Fixes", () => {
  test("app/[category]/[slug]/page.tsx wraps dates in new Date()", () => {
    const source = readWorkspaceFile("app/[category]/[slug]/page.tsx")
    expect(source).toContain("new Date(post.publishedAt).toISOString()")
    expect(source).toContain("new Date(post.updatedAt).toISOString()")
    expect(source).toContain("new Date(article.publishedAt).toISOString()")
    expect(source).toContain("new Date(article.updatedAt).toISOString()")
  })

  test("app/admin/edit/[id]/page.tsx wraps dates in new Date()", () => {
    const source = readWorkspaceFile("app/admin/edit/[id]/page.tsx")
    expect(source).toContain("new Date(currentPost.updatedAt).toISOString()")
    expect(source).toContain("new Date(post.updatedAt).toISOString()")
  })
})

describe("Source Verification: Admin Actions revalidation", () => {
  test("posts actions call revalidateTag", () => {
    const source = readWorkspaceFile("app/admin/actions/posts.ts")
    expect(source).toContain('revalidatePost')
  })

  test("workflow actions call revalidateTag", () => {
    const source = readWorkspaceFile("app/admin/actions/workflow.ts")
    expect(source).toContain('revalidatePost')
  })
})
