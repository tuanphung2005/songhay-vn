import { describe, expect, test } from "bun:test"
import { readFileSync } from "node:fs"
import { join } from "node:path"

function readWorkspaceFile(relativePath: string) {
  return readFileSync(join(process.cwd(), relativePath), "utf8")
}

describe("editorial workflow", () => {
  test("post creation supports draft and pending review flow", () => {
    const source = readWorkspaceFile("app/admin/actions/posts.ts")

    expect(source).toContain("resolveEditorialFromSubmitAction")
    expect(source).toContain("editorialStatus === \"DRAFT\"")
    expect(source).toContain("/admin?tab=posts&postsStatus=pending-publish&toast=post_submitted_publish")
    expect(source).toContain("redirect(\"/admin?tab=posts&postsStatus=pending-review&toast=post_submitted_review\")")
    expect(source).toContain("redirect(\"/admin?tab=personal-archive&toast=post_saved_draft\")")
    expect(source).toContain("authorId: currentUser.id")
  })

  test("admin actions include approval metadata updates", () => {
    const source = readWorkspaceFile("app/admin/actions/workflow.ts")

    expect(source).toContain("export async function approvePendingPost")
    expect(source).toContain("editorialStatus: canPublishNow(currentUser.role) ? \"PUBLISHED\" : \"PENDING_PUBLISH\"")
    expect(source).toContain("approverId: currentUser.id")
    expect(source).toContain("approvedAt: new Date()")
    expect(source).toContain("export async function rejectPendingPost")
    expect(source).toContain("editorialStatus: \"REJECTED\"")
    expect(source).toContain("export async function returnPostToPendingReview")
    expect(source).toContain("editorialStatus: \"PENDING_REVIEW\"")
    expect(source).toContain("export async function returnPostToPendingPublish")
    expect(source).toContain("editorialStatus: \"PENDING_PUBLISH\"")
  })

  test("posts and personal archive UI components are wired", () => {
    const pageSource = readWorkspaceFile("app/admin/page.tsx")
    const postsSource = readWorkspaceFile("components/admin/posts-tab.tsx")
    const personalSource = readWorkspaceFile("components/admin/personal-archive-tab.tsx")

    expect(pageSource).toContain("<PostsTab")
    expect(pageSource).toContain("<PersonalArchiveTab")
    expect(postsSource).toContain("Lên chờ xuất bản")
    expect(postsSource).toContain("Lên chờ duyệt")
    expect(postsSource).toContain("Trả về kho")
    expect(postsSource).toContain("Trả về chờ xuất bản")
    expect(personalSource).toContain("statusLabel")
  })
})
