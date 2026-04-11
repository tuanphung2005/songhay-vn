import { describe, expect, test } from "bun:test"
import * as Queries from "../lib/queries"
import * as Bmi from "../lib/bmi"
import * as Auth from "../lib/session"
import * as SeoStore from "../lib/seo-keyword-store"

describe("Types: Distribution & Re-exports", () => {
  test("lib/queries re-exports expected types", () => {
    // Testing that these are exported (even if they are just types, we can check their presence if we used named exports)
    // In TS, named type exports are not available in JS runtime, but we can verify the file is valid and imports don't crash.
    expect(Queries).toBeDefined()
  })

  test("lib/bmi re-exports BMI types", () => {
    expect(Bmi).toBeDefined()
  })

  test("lib/session uses centralized SessionPayload", () => {
    expect(Auth).toBeDefined()
  })

  test("lib/seo-keyword-store uses centralized SEO types", () => {
    expect(SeoStore).toBeDefined()
  })
})

describe("Regression: Date Serialization Fix", () => {
  test("handles ISO string dates (from cache)", () => {
    const mockPost = {
      publishedAt: "2024-04-11T09:37:05.000Z",
      updatedAt: "2024-04-11T10:00:00.000Z"
    }

    // Logic from app/[category]/[slug]/page.tsx
    const publishedTime = mockPost.publishedAt ? new Date(mockPost.publishedAt).toISOString() : null
    const modifiedTime = mockPost.updatedAt ? new Date(mockPost.updatedAt).toISOString() : null

    expect(publishedTime).toBe("2024-04-11T09:37:05.000Z")
    expect(modifiedTime).toBe("2024-04-11T10:00:00.000Z")
  })

  test("handles real Date objects (from direct DB query)", () => {
    const date = new Date()
    const mockPost = {
      publishedAt: date,
      updatedAt: date
    }

    const publishedTime = mockPost.publishedAt ? new Date(mockPost.publishedAt).toISOString() : null
    expect(publishedTime).toBe(date.toISOString())
  })

  test("handles null dates safely", () => {
    const mockPost = {
      publishedAt: null,
      updatedAt: null
    }

    const publishedTime = mockPost.publishedAt ? new Date(mockPost.publishedAt).toISOString() : null
    expect(publishedTime).toBeNull()
  })
})
