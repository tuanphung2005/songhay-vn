import { describe, expect, test } from "bun:test"
import { readFileSync } from "node:fs"
import { join } from "node:path"

function readWorkspaceFile(relativePath: string) {
  return readFileSync(join(process.cwd(), relativePath), "utf8")
}

describe("editorial workflow", () => {
  test("post creation routes USER content to pending review", () => {
    const source = readWorkspaceFile("app/admin/actions.ts")

    expect(source).toContain("const editorialStatus = isAdmin && requestedPublished ? \"PUBLISHED\" : \"PENDING_REVIEW\"")
    expect(source).toContain("redirect(\"/admin?tab=pending-posts&toast=post_submitted_review\")")
    expect(source).toContain("authorId: currentUser.id")
  })

  test("admin actions include approve and reject for pending posts", () => {
    const source = readWorkspaceFile("app/admin/actions.ts")

    expect(source).toContain("export async function approvePendingPost")
    expect(source).toContain("editorialStatus: \"PUBLISHED\"")
    expect(source).toContain("export async function rejectPendingPost")
    expect(source).toContain("editorialStatus: \"REJECTED\"")
  })

  test("pending and personal archive UI components are wired", () => {
    const pageSource = readWorkspaceFile("app/admin/page.tsx")
    const pendingSource = readWorkspaceFile("components/admin/pending-posts-tab.tsx")
    const personalSource = readWorkspaceFile("components/admin/personal-archive-tab.tsx")

    expect(pageSource).toContain("<PendingPostsTab")
    expect(pageSource).toContain("<PersonalArchiveTab")
    expect(pendingSource).toContain("Duyệt & xuất bản")
    expect(personalSource).toContain("statusLabel")
  })
})
