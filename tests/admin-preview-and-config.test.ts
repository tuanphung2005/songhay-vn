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

  test("admin preview route includes editorial relations and draft state", () => {
    const source = readWorkspaceFile("app/admin/preview/[id]/page.tsx")

    expect(source).toContain("include: {")
    expect(source).toContain("approver:")
    expect(source).toContain("post.isDraft")
    expect(source).toContain("index: false")
    expect(source).toContain("follow: false")
  })
})
