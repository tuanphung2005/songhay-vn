import { describe, expect, test } from "bun:test"
import { resolveAspectRatio } from "../lib/media-utils"

describe("Unit: Media Utilities", () => {
  test("resolveAspectRatio returns correct tailwind classes", () => {
    expect(resolveAspectRatio("video")).toBe("aspect-video")
    expect(resolveAspectRatio("square")).toBe("aspect-square")
    expect(resolveAspectRatio("3/2")).toBe("aspect-[3/2]")
    expect(resolveAspectRatio("12/7")).toBe("aspect-[12/7]")
    expect(resolveAspectRatio("portrait")).toBe("aspect-[3/4]")
  })

  test("resolveAspectRatio defaults to 12/7 for news thumbnails", () => {
    expect(resolveAspectRatio(undefined)).toBe("aspect-[12/7]")
    expect(resolveAspectRatio("unknown")).toBe("aspect-[12/7]")
  })
})
