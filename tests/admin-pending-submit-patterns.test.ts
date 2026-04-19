import { describe, expect, test } from "bun:test"
import { readFileSync } from "node:fs"
import { join } from "node:path"

function readWorkspaceFile(relativePath: string) {
  return readFileSync(join(process.cwd(), relativePath), "utf8")
}

describe("admin pending submit patterns", () => {
  test("admin mutation tabs use shared pending submit button", () => {
    const pendingPosts = readWorkspaceFile(
      "components/admin/pending-posts-tab.tsx"
    )
    const posts = readWorkspaceFile(
      "components/admin/posts-tab/post-actions-cell.tsx"
    )
    const personalArchive = readWorkspaceFile(
      "components/admin/personal-archive-tab.tsx"
    )
    const trash = readWorkspaceFile("components/admin/trash-tab.tsx")
    const categories = readWorkspaceFile(
      "components/admin/categories-tab/index.tsx"
    )

    expect(pendingPosts).toContain("PendingSubmitButton")
    expect(posts).toContain("PendingSubmitButton")
    expect(trash).toContain("PendingSubmitButton")
    expect(categories).toContain("PendingSubmitButton")
  })

  test("confirm-action forms no longer rely on window.confirm", () => {
    const confirmActionForm = readWorkspaceFile(
      "components/admin/confirm-action-form.tsx"
    )
    const mediaLibrary = readWorkspaceFile(
      "components/admin/media-library-tab.tsx"
    )

    expect(confirmActionForm).toContain("AlertDialog")
    expect(confirmActionForm).not.toContain("window.confirm")

    expect(mediaLibrary).toContain("AlertDialog")
    expect(mediaLibrary).not.toContain("window.confirm")
  })
})
