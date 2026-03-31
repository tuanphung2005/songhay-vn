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

  test("maps sidebar counts to related tabs", () => {
    const source = readWorkspaceFile("app/admin/page-helpers.ts")

    expect(source).toContain('countKey: "postCount"')
    expect(source).toContain('countKey: "trashedPostCount"')
    expect(source).toContain('countKey: "categoryCount"')
    expect(source).toContain('countKey: "pendingCommentCount"')
  })

  test("removes snapshot card and renders counts in nav buttons", () => {
    const pageSource = readWorkspaceFile("app/admin/page.tsx")
    const navButtonSource = readWorkspaceFile("components/admin/admin-nav-button.tsx")

    expect(pageSource).not.toContain("Snapshot hệ thống")
    expect(pageSource).toContain("navCountByKey")
    expect(navButtonSource).toContain("count?: number")
    expect(navButtonSource).toContain("toLocaleString(\"vi-VN\")")
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
