import { describe, expect, test } from "bun:test"
import { readFileSync } from "node:fs"
import { join } from "node:path"

function readWorkspaceFile(relativePath: string) {
  return readFileSync(join(process.cwd(), relativePath), "utf8")
}

describe("admin preview route and config", () => {
  test("next config sets serverActions size limit under experimental", () => {
    const source = readWorkspaceFile("next.config.mjs")

    expect(source).toContain("experimental")
    expect(source).toContain("serverActions")
    expect(source).toContain("bodySizeLimit: \"250mb\"")
  })

  test("admin preview route renders full website layout with preview banner", () => {
    const source = readWorkspaceFile("app/admin/preview/[id]/page.tsx")

    // Must still be noindexed
    expect(source).toContain("index: false")
    expect(source).toContain("follow: false")

    // Must require CMS auth
    expect(source).toContain("requireCmsUser")

    // Renders real site layout
    expect(source).toContain("SiteHeader")
    expect(source).toContain("SiteFooter")

    // Shows a preview banner
    expect(source).toContain("Chế độ xem trước")
  })
})
