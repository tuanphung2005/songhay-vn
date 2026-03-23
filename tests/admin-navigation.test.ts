import { describe, expect, test } from "bun:test"
import { readFileSync } from "node:fs"
import { join } from "node:path"

function readWorkspaceFile(relativePath: string) {
  return readFileSync(join(process.cwd(), relativePath), "utf8")
}

describe("admin navigation submenu", () => {
  test("renders grouped submenu labels in admin page", () => {
    const source = readWorkspaceFile("app/admin/page.tsx")
    const helperSource = readWorkspaceFile("app/admin/page-helpers.ts")

    expect(source).toContain("Quản lý tin")
    expect(source).toContain("Cài đặt")
    expect(helperSource).toContain("Kho bài")
    expect(helperSource).toContain("Kho dữ liệu")
    expect(helperSource).toContain("Lưu trữ cá nhân")
    expect(helperSource).toContain("Đổi mật khẩu")
  })

  test("supports new tab keys used by submenu groups", () => {
    const source = readWorkspaceFile("app/admin/page-helpers.ts")

    expect(source).toContain('key: "posts"')
    expect(source).toContain('key: "media-library"')
    expect(source).toContain('key: "personal-archive"')
    expect(source).toContain('key: "settings-password"')
  })

  test("keeps admin-only gates on sensitive tabs", () => {
    const source = readWorkspaceFile("app/admin/page-helpers.ts")
    const pageSource = readWorkspaceFile("app/admin/page.tsx")

    expect(source).toContain('adminOnly: true')
    expect(source).toContain("canManageSettings")
    expect(source).toContain("CONTENT_MANAGEMENT_TABS.filter")
    expect(source).toContain("SETTINGS_TABS.filter")
    expect(pageSource).toContain("getVisibleTabs")
  })
})
