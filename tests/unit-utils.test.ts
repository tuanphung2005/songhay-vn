import { describe, expect, test } from "bun:test"
import { calculateBmi } from "../lib/bmi"
import { slugify } from "../lib/slug"
import { hashPassword, verifyPassword } from "../lib/password"
import { cn } from "../lib/utils"
import { normalizeArticleHtml } from "../lib/html"

describe("Unit: BMI Calculation", () => {
  test("calculates BMI correctly for male", () => {
    // 175cm, 70kg -> 70 / (1.75 * 1.75) = 22.85 (Normal)
    const result = calculateBmi(175, 70, "male")
    expect(result.bmi).toBeCloseTo(22.85, 1)
    expect(result.category).toBe("Bình thường")
    expect(result.genderLabel).toBe("Nam")
  })

  test("calculates BMI correctly for female", () => {
    // 160cm, 45kg -> 45 / (1.6 * 1.6) = 17.57 (Underweight)
    const result = calculateBmi(160, 45, "female")
    expect(result.bmi).toBeCloseTo(17.57, 1)
    expect(result.category).toBe("Thiếu cân")
    expect(result.genderLabel).toBe("Nữ")
  })

  test("identifies overweight and obesity correctly", () => {
    // Male Overweight: 175cm, 90kg -> 90 / (1.75 * 1.75) = 29.38
    const overweight = calculateBmi(175, 90, "male")
    expect(overweight.category).toBe("Thừa cân")

    // Male Obese: 175cm, 100kg -> 100 / (1.75 * 1.75) = 32.65
    const obese = calculateBmi(175, 100, "male")
    expect(obese.category).toBe("Béo phì")
  })
})

describe("Unit: Slugification", () => {
  test("creates valid slugs from various inputs", () => {
    expect(slugify("Hello World")).toBe("hello-world")
    expect(slugify("  Trim Me  ")).toBe("trim-me")
    expect(slugify("Multiple   Spaces")).toBe("multiple-spaces")
    expect(slugify("Special @#$% Characters")).toBe("special-characters")
  })

  test("handles Vietnamese accents correctly", () => {
    expect(slugify("Học lập trình")).toBe("hoc-lap-trinh")
    expect(slugify("Công nghệ thông tin")).toBe("cong-nghe-thong-tin")
    expect(slugify("Chào buổi sáng Việt Nam")).toBe("chao-buoi-sang-viet-nam")
  })
})

describe("Unit: Password Utilities", () => {
  test("hashes and verifies password correctly", () => {
    const password = "my-secret-password"
    const hash = hashPassword(password)
    
    expect(hash).toContain(":")
    expect(verifyPassword(password, hash)).toBe(true)
    expect(verifyPassword("wrong-password", hash)).toBe(false)
  })

  test("handles invalid hash format gracefully", () => {
    expect(verifyPassword("password", "invalidhash")).toBe(false)
    expect(verifyPassword("password", ":")).toBe(false)
    expect(verifyPassword("password", "salt:hash:extra")).toBe(false)
  })
})

describe("Unit: Class Merge Utility (cn)", () => {
  test("merges tailwind classes correctly", () => {
    expect(cn("px-2", "py-2")).toBe("px-2 py-2")
    expect(cn("px-2 py-2", "p-4")).toBe("p-4") // py-2 and px-2 are overridden by p-4 by tailwind-merge
    expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500")
    expect(cn("bg-red-500", { "bg-blue-500": true, "text-white": false })).toBe("bg-blue-500")
  })
})

describe("Unit: HTML Normalization", () => {
  test("removes empty paragraphs", () => {
    expect(normalizeArticleHtml("<p></p><p>Text</p><p>&nbsp;</p>")).toBe("<p>Text</p>")
  })

  test("converts span underlines/strikethroughs to semantic tags", () => {
    expect(normalizeArticleHtml('<span style="text-decoration: underline">Underline</span>')).toBe("<u>Underline</u>")
    expect(normalizeArticleHtml('<span style="text-decoration: line-through">Strike</span>')).toBe("<s>Strike</s>")
  })

  test("filters allowed styles and removes others", () => {
    const input = '<p style="text-align: center; color: red; margin-top: 20px; font-size: 16px">Styled Text</p>'
    const output = normalizeArticleHtml(input)
    expect(output).toContain('style="text-align:center;color:red;font-size:16px"')
    expect(output).not.toContain("margin-top")
  })

  test("preserves images and videos/iframes unaffected", () => {
    const img = '<figure><img src="test.jpg" alt="test" /><figcaption>Test</figcaption></figure>'
    const video = '<div class="video-wrap"><video controls src="test.mp4"></video></div>'
    const iframe = '<iframe src="https://youtube.com/embed/123"></iframe>'
    
    expect(normalizeArticleHtml(img)).toBe(img)
    expect(normalizeArticleHtml(video)).toBe(video)
    expect(normalizeArticleHtml(iframe)).toBe(iframe)
  })
})
