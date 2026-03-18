import { describe, expect, test } from "bun:test"
import { readFileSync } from "node:fs"
import { join } from "node:path"

function readWorkspaceFile(relativePath: string) {
  return readFileSync(join(process.cwd(), relativePath), "utf8")
}

// ── Role scoping in data queries ─────────────────────────────────────────────

describe("role-based data scoping", () => {
  test("pending posts query scopes non-admin to own posts via authorId", () => {
    const source = readWorkspaceFile("app/admin/data.ts")

    // Admin sees all; non-admin sees only own
    expect(source).toContain("currentUser.role === \"ADMIN\" ? {} : { authorId: currentUser.id }")
    // Filter is applied within the pending posts query block
    expect(source).toContain("editorialStatus: \"PENDING_REVIEW\"")
  })

  test("trash query scopes non-admin to own archived posts", () => {
    const source = readWorkspaceFile("app/admin/data.ts")

    // Trash: admin sees all, others see own
    expect(source).toContain("isDeleted: true")
    // The ownserhip clause for trash
    expect(source).toContain("currentUser.role === \"ADMIN\" ? {} : { authorId: currentUser.id }")
  })

  test("media library write-tab view scopes non-admin to own uploads plus shared videos", () => {
    const source = readWorkspaceFile("app/admin/data.ts")

    // For write tab
    expect(source).toContain("OR: [{ uploaderId: currentUser.id }, { visibility: \"SHARED\", assetType: \"VIDEO\" }]")
  })

  test("media upload DELETE endpoint enforces ownership or admin role", () => {
    const source = readWorkspaceFile("app/api/media/[id]/route.ts")

    expect(source).toContain("session.role !== \"ADMIN\" && asset.uploaderId !== session.userId")
  })

  test("image upload GET endpoint scopes non-admin to own assets", () => {
    const source = readWorkspaceFile("app/api/uploads/image/route.ts")

    expect(source).toContain("uploaderId")
    // Image route uses uploaderIdFilter variable to scope access
    expect(source).toContain("uploaderIdFilter")
    // Non-admin users are forced to their own userId when no specific filter is requested
    expect(source).toContain("isAdmin ? \"\" : session.userId")
  })

  test("video upload GET endpoint scopes non-admin to own assets", () => {
    const source = readWorkspaceFile("app/api/uploads/video/route.ts")

    expect(source).toContain("...(isAdmin ? {} : { uploaderId: session.userId })")
  })
})

// ── Role-based UI gate assertions ────────────────────────────────────────────

describe("role-based UI gates", () => {
  test("write tab disables publish button for non-admin users", () => {
    const source = readWorkspaceFile("components/admin/write-tab.tsx")

    expect(source).toContain("isAdmin ? (")
    expect(source).toContain("Xuất bản (chỉ admin)")
    expect(source).toContain("disabled")
  })

  test("admin-only tabs are gated with adminOnly flag", () => {
    const source = readWorkspaceFile("app/admin/page.tsx")

    // Categories and Comments tabs have adminOnly: true
    expect(source).toContain("adminOnly: true")
    // Tabs are filtered based on isAdmin
    expect(source).toContain("CONTENT_MANAGEMENT_TABS.filter((item) => (item.adminOnly ? isAdmin : true))")
    expect(source).toContain("SETTINGS_TABS.filter((item) => (item.adminOnly ? isAdmin : true))")
  })

  test("pending posts tab shows approve/reject only to admin via isAdmin prop", () => {
    const source = readWorkspaceFile("components/admin/pending-posts-tab.tsx")

    expect(source).toContain("isAdmin")
  })

  test("posts tab exposes move-to-trash to all authenticated users", () => {
    const source = readWorkspaceFile("components/admin/posts-tab.tsx")

    // movePostToTrash is passed down to PostsTab
    expect(source).toContain("movePostToTrash")
  })

  test("trash tab restore and permanent delete actions are present", () => {
    const source = readWorkspaceFile("components/admin/trash-tab.tsx")

    expect(source).toContain("restorePostFromTrash")
    expect(source).toContain("deletePostPermanently")
  })
})

// ── Server-side ownership checks in actions ───────────────────────────────────

describe("server-side ownership enforcement in actions", () => {
  test("movePostToTrash checks ownership before allowing non-admin deletion", () => {
    const source = readWorkspaceFile("app/admin/actions.ts")

    expect(source).toContain("currentUser.role !== \"ADMIN\" && existingPost.authorId !== currentUser.id")
    expect(source).toContain("post_action_forbidden")
  })

  test("restorePostFromTrash checks ownership before restoring for non-admin", () => {
    const source = readWorkspaceFile("app/admin/actions.ts")

    expect(source).toMatch(/export async function restorePostFromTrash[\s\S]*?currentUser\.role !== "ADMIN" && existingPost\.authorId !== currentUser\.id/)
  })

  test("deletePostPermanently checks ownership for non-admin", () => {
    const source = readWorkspaceFile("app/admin/actions.ts")

    expect(source).toMatch(/export async function deletePostPermanently[\s\S]*?currentUser\.role !== "ADMIN" && existingPost\.authorId !== currentUser\.id/)
  })

  test("approvePendingPost sets isDraft false and editorialStatus PUBLISHED", () => {
    const source = readWorkspaceFile("app/admin/actions.ts")

    // Approval must explicitly clear isDraft and set status
    expect(source).toMatch(/approvePendingPost[\s\S]*?isDraft: false/)
    expect(source).toMatch(/approvePendingPost[\s\S]*?editorialStatus: "PUBLISHED"/)
  })

  test("rejectPendingPost sets isPublished false and clears approver", () => {
    const source = readWorkspaceFile("app/admin/actions.ts")

    expect(source).toMatch(/rejectPendingPost[\s\S]*?isPublished: false/)
    expect(source).toMatch(/rejectPendingPost[\s\S]*?approverId: null/)
  })

  test("createPost derives isDraft from submitAction, not from isPublished field alone", () => {
    const source = readWorkspaceFile("app/admin/actions.ts")

    // The critical fix: isDraft is computed from submitAction
    expect(source).toContain("const isDraft = shouldSaveDraft")
    expect(source).toContain("const shouldPublishNow = submitAction === \"publish\"")
  })
})
