import { describe, expect, test } from "bun:test"
import { readFileSync } from "node:fs"
import { join } from "node:path"

function readWorkspaceFile(relativePath: string) {
  return readFileSync(join(process.cwd(), relativePath), "utf8")
}

describe("Refactor and Optimization Verification", () => {
  test("PostCardList implements ad injection and divider logic", () => {
    const source = readWorkspaceFile("components/news/post-card-list.tsx")

    expect(source).toContain("Fragment")
    expect(source).toContain("adEvery")
    expect(source).toContain("AdPlaceholder")
    expect(source).toContain("index !== posts.length - 1") // Ad-between-posts constraint
  })

  test("SiteHeader supports pre-fetched categories optimization", () => {
    const source = readWorkspaceFile("components/news/site-header.tsx")

    expect(source).toContain("navCategories?: Awaited<ReturnType<typeof getNavCategories>>")
    expect(source).toContain("propNavCategories ? Promise.resolve(null) : getNavCategories()")
    expect(source).toContain("propNavCategories ?? fetchedNavCategories!")
  })

  test("Admin data loading implements selective fetching", () => {
    const source = readWorkspaceFile("app/admin/data.ts")

    expect(source).toContain("switch (activeTab)")
    expect(source).toContain('case "overview":')
    expect(source).toContain('case "write":')
    expect(source).toContain('case "posts":')
    // Verify default initialization
    expect(source).toContain("let postsData: Awaited<ReturnType<typeof getPostsData>> = {")
    expect(source).toContain("rows: [],") // for personalPostsData and trashedPosts
  })

  test("MostRead is a server component without redundant client fetching", () => {
    const source = readWorkspaceFile("components/news/most-read.tsx")

    expect(source).not.toContain('"use client"')
    expect(source).not.toContain("useEffect")
    expect(source).not.toContain("useState")
    expect(source).not.toContain('fetch("/api/posts/most-read")')
  })

  test("Weather widget uses lazy loading", () => {
    const source = readWorkspaceFile("components/news/ai-weather-widget.tsx")
    expect(source).toContain('loading="lazy"')
  })

  test("Font weights are optimized in layout", () => {
    const source = readWorkspaceFile("app/layout.tsx")
    
    // Check Be Vietnam Pro weights (removed 500, 800)
    expect(source).toContain('weight: ["400", "600", "700"]')
    expect(source).not.toContain('"500"')
    
    // Check Merriweather weights (removed 900)
    expect(source).toContain('weight: ["400", "700"]')
    expect(source).not.toContain('"900"')
  })
})
