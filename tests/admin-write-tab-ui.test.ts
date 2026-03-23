import { describe, expect, test } from "bun:test"
import { readFileSync } from "node:fs"
import { join } from "node:path"

function readWorkspaceFile(relativePath: string) {
  return readFileSync(join(process.cwd(), relativePath), "utf8")
}

describe("admin write tab UI", () => {
  test("write tab groups SEO fields and supports sensitive toggle", () => {
    const source = readWorkspaceFile("components/admin/write-tab.tsx")

    expect(source).toContain("<legend className=\"px-1 text-sm font-semibold\">SEO</legend>")
    expect(source).toContain("name=\"seoKeywords\"")
    expect(source).toContain("name=\"isSensitive\"")
  })

  test("write tab supports draft and review actions", () => {
    const source = readWorkspaceFile("components/admin/write-tab.tsx")

    expect(source).toContain("name=\"submitAction\" value=\"save-draft\"")
    expect(source).toContain("name=\"submitAction\" value=\"submit-review\"")
    expect(source).toContain("name=\"submitAction\" value=\"publish\"")
  })

  test("write tab has preview button and capability-gated publish actions", () => {
    const source = readWorkspaceFile("components/admin/write-tab.tsx")

    // Preview button opens new tab
    expect(source).toContain("Xem trước")
    expect(source).toContain("createPostForPreview")
    expect(source).toContain("window.open")

    expect(source).toContain("canPublishNow")
    expect(source).toContain("canSubmitPendingPublish")
    expect(source).not.toContain("Xuất bản (chỉ admin)")
  })

  test("write tab pending review button uses destructive variant", () => {
    const source = readWorkspaceFile("components/admin/write-tab.tsx")
    // The Gửi chờ duyệt button should use destructive (red) variant
    expect(source).toContain("value=\"submit-review\"")
    expect(source).toContain("variant=\"destructive\"")
  })

  test("rich text field media picker has pagination controls", () => {
    const source = readWorkspaceFile("components/admin/rich-text-field.tsx")

    expect(source).toContain("const [pickerPage, setPickerPage] = useState(1)")
    expect(source).toContain("Trang {safePickerPage}/{pickerTotalPages}")
    expect(source).toContain("setPickerPage((value) => Math.max(1, value - 1))")
  })
})
