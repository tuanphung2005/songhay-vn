import { describe, expect, test, afterEach } from "bun:test"
import { getSiteUrl, toAbsoluteUrl } from "../lib/seo"

describe("Unit: SEO Utilities", () => {
  const originalEnv = process.env.NEXT_PUBLIC_SITE_URL

  afterEach(() => {
    process.env.NEXT_PUBLIC_SITE_URL = originalEnv
  })

  test("getSiteUrl returns default when env is not set", () => {
    delete process.env.NEXT_PUBLIC_SITE_URL
    expect(getSiteUrl()).toBe("https://songhay.vn")
  })

  test("getSiteUrl returns env value when set", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://example.com"
    expect(getSiteUrl()).toBe("https://example.com")
  })

  test("getSiteUrl trims trailing slash", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://example.com/"
    expect(getSiteUrl()).toBe("https://example.com")
  })

  test("toAbsoluteUrl returns same if already absolute", () => {
    expect(toAbsoluteUrl("https://other.com/page")).toBe("https://other.com/page")
    expect(toAbsoluteUrl("http://other.com/page")).toBe("http://other.com/page")
  })

  test("toAbsoluteUrl prepends site URL to paths", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://mysite.com"
    
    expect(toAbsoluteUrl("/test-path")).toBe("https://mysite.com/test-path")
    expect(toAbsoluteUrl("no-slash-path")).toBe("https://mysite.com/no-slash-path")
  })
})
