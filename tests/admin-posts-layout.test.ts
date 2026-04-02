import { describe, expect, test } from "bun:test"
import { readFileSync } from "node:fs"
import { join } from "node:path"

function readWorkspaceFile(relativePath: string) {
  return readFileSync(join(process.cwd(), relativePath), "utf8")
}

describe("admin posts layout", () => {
  test("posts filter bar sits above a cardless results area", () => {
    const source = readWorkspaceFile("components/admin/posts-tab/index.tsx")

    expect(source).toContain('return (\n    <div className="space-y-4">')
    expect(source).toContain("<PostsFilterBar")
    expect(source).toContain(
      "<PostsTable posts={postsData.posts} {...permissions} {...actions} />"
    )
    expect(source).toContain(
      'className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-100 pt-3"'
    )
    expect(source).not.toContain('from "@/components/ui/card"')
    expect(source).not.toContain("<Card")
  })

  test("posts table uses larger thumbnails to better fill tall action rows", () => {
    const source = readWorkspaceFile(
      "components/admin/posts-tab/posts-table.tsx"
    )

    expect(source).toContain("width={84}")
    expect(source).toContain("height={60}")
    expect(source).toContain(
      'className="mt-0.5 h-[60px] w-[84px] shrink-0 rounded-md border border-zinc-200 object-cover"'
    )
  })

  test("admin content tabs keep key management surfaces cardless", () => {
    const categoriesSource = readWorkspaceFile(
      "components/admin/categories-tab/index.tsx"
    )
    const writeSource = readWorkspaceFile("components/admin/write-tab.tsx")
    const adminPageSource = readWorkspaceFile("app/admin/page.tsx")

    expect(categoriesSource).not.toContain('from "@/components/ui/card"')
    expect(categoriesSource).not.toContain("<Card")
    expect(writeSource).not.toContain('from "@/components/ui/card"')
    expect(writeSource).not.toContain("<Card")
    expect(adminPageSource).not.toContain('from "@/components/ui/card"')
    expect(adminPageSource).not.toContain("<Card")
  })

  test("admin navigation uses a white shell with subtle nav states", () => {
    const adminPageSource = readWorkspaceFile("app/admin/page.tsx")
    const navButtonSource = readWorkspaceFile(
      "components/admin/admin-nav-button.tsx"
    )

    expect(adminPageSource).toContain(
      "grid min-h-[calc(100dvh-5rem)] w-full md:grid-cols-[288px_minmax(0,1fr)]"
    )
    expect(adminPageSource).toContain(
      "border-b border-zinc-200 bg-white md:border-r md:border-b-0"
    )
    expect(navButtonSource).toContain('variant="ghost"')
    expect(navButtonSource).toContain(
      "border-zinc-200 bg-zinc-100 text-zinc-900"
    )
    expect(navButtonSource).toContain("text-zinc-600")
    expect(navButtonSource).toContain("bg-zinc-900 text-white")
  })

  test("admin header matches the white shell palette", () => {
    const adminPageSource = readWorkspaceFile("app/admin/page.tsx")

    expect(adminPageSource).toContain(
      'className="border-b border-zinc-200 bg-white"'
    )
    expect(adminPageSource).toContain("text-zinc-500 uppercase")
    expect(adminPageSource).toContain("text-zinc-900 md:text-2xl")
    expect(adminPageSource).toContain(
      'className="hidden h-8 items-center gap-1.5 px-3 md:inline-flex"'
    )
  })
})
