import { describe, expect, test } from "bun:test"
import { readFileSync } from "node:fs"
import { join } from "node:path"

function readWorkspaceFile(relativePath: string) {
  return readFileSync(join(process.cwd(), relativePath), "utf8")
}

describe("admin filters and pagination", () => {
  test("admin data supports posts/personal/trash filter objects", () => {
    const source = readWorkspaceFile("app/admin/data.ts")

    expect(source).toContain("postsFilters")
    expect(source).toContain("personalArchiveFilters")
    expect(source).toContain("trashFilters")
    expect(source).toContain("getPersonalPostsData")
    expect(source).toContain("getTrashedPostsData")
  })

  test("posts tab exposes advanced filter inputs", () => {
    const source = readWorkspaceFile(
      "components/admin/posts-tab/post-filter-bar.tsx"
    )

    expect(source).toContain('name="postsApproval"')
    expect(source).toContain('name="postsAuthor"')
    expect(source).toContain('name="postsFrom"')
    expect(source).toContain('name="postsTo"')
    expect(source).toContain("postsPage")
  })

  test("personal archive and trash tabs expose pagination links", () => {
    const personal = readWorkspaceFile(
      "components/admin/personal-archive-tab.tsx"
    )
    const trash = readWorkspaceFile("components/admin/trash-tab.tsx")

    expect(personal).toContain("personalPage")
    expect(personal).toContain("paginationItems")
    expect(trash).toContain("trashPage")
    expect(trash).toContain("paginationItems")
  })
})
