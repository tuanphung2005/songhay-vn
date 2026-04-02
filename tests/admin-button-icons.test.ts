import { describe, expect, test } from "bun:test"
import { readFileSync } from "node:fs"
import { join } from "node:path"

function readWorkspaceFile(relativePath: string) {
  return readFileSync(join(process.cwd(), relativePath), "utf8")
}

describe("admin button icons", () => {
  test("write and edit post screens add icons to primary actions", () => {
    const writeSource = readWorkspaceFile("components/admin/write-tab.tsx")
    const editSource = readWorkspaceFile("app/admin/edit/[id]/page.tsx")

    expect(writeSource).toContain("Save className")
    expect(writeSource).toContain("Eye className")
    expect(writeSource).toContain("SendToBack className")
    expect(writeSource).toContain("Globe className")

    expect(editSource).toContain("ArrowLeft className")
    expect(editSource).toContain("Save className")
    expect(editSource).toContain("Send className")
    expect(editSource).toContain("Globe className")
  })

  test("archive, trash, comments, and settings tabs use recognizable action icons", () => {
    const personalSource = readWorkspaceFile(
      "components/admin/personal-archive-tab.tsx"
    )
    const trashSource = readWorkspaceFile("components/admin/trash-tab.tsx")
    const commentsSource = readWorkspaceFile(
      "components/admin/comments-tab.tsx"
    )
    const moderationSource = readWorkspaceFile(
      "components/admin/settings-moderation-tab.tsx"
    )
    const passwordSource = readWorkspaceFile(
      "components/admin/settings-password-tab.tsx"
    )
    const permissionsSource = readWorkspaceFile(
      "components/admin/settings-permissions-tab.tsx"
    )
    const usersSource = readWorkspaceFile(
      "components/admin/settings-users-tab.tsx"
    )

    expect(personalSource).toContain("Filter className")
    expect(personalSource).toContain("Pencil className")
    expect(personalSource).toContain("Trash2 className")

    expect(trashSource).toContain("RotateCcw className")
    expect(trashSource).toContain("Trash2 className")

    expect(commentsSource).toContain("Check className")
    expect(commentsSource).toContain("Eye className")

    expect(moderationSource).toContain("Plus className")
    expect(moderationSource).toContain("Trash2 className")
    expect(passwordSource).toContain("UserPlus className")
    expect(permissionsSource).toContain("Save className")
    expect(usersSource).toContain("Save className")
    expect(usersSource).toContain("Trash2 className")
  })

  test("media library controls include icons for search, delete, and pagination", () => {
    const source = readWorkspaceFile("components/admin/media-library-tab.tsx")

    expect(source).toContain("Search className")
    expect(source).toContain("Trash2 className")
    expect(source).toContain("ChevronLeft className")
    expect(source).toContain("ChevronRight className")
  })
})
