import { describe, expect, test } from "bun:test"
import { readFileSync } from "node:fs"
import { join } from "node:path"

function readWorkspaceFile(relativePath: string) {
  return readFileSync(join(process.cwd(), relativePath), "utf8")
}

describe("admin navigation submenu", () => {
  test("renders grouped submenu labels in admin page", () => {
    const source = readWorkspaceFile("app/admin/page.tsx")

    expect(source).toContain("Quản lý tin")
    expect(source).toContain("Settings")
    expect(source).toContain("Kho bài chờ duyệt")
    expect(source).toContain("Kho dữ liệu")
    expect(source).toContain("Lưu trữ cá nhân")
    expect(source).toContain("Đổi mật khẩu")
  })

  test("supports new tab keys used by submenu groups", () => {
    const source = readWorkspaceFile("app/admin/page.tsx")

    expect(source).toContain('key: "pending-posts"')
    expect(source).toContain('key: "media-library"')
    expect(source).toContain('key: "personal-archive"')
    expect(source).toContain('key: "settings-password"')
  })

  test("keeps admin-only gates on sensitive tabs", () => {
    const source = readWorkspaceFile("app/admin/page.tsx")

    expect(source).toContain('adminOnly: true')
    expect(source).toContain('const isAdmin = currentUser.role === "ADMIN"')
    expect(source).toContain("CONTENT_MANAGEMENT_TABS.filter")
    expect(source).toContain("SETTINGS_TABS.filter")
  })
})
