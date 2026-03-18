import { describe, expect, test } from "bun:test"
import { readFileSync } from "node:fs"
import { join } from "node:path"

function readWorkspaceFile(relativePath: string) {
  return readFileSync(join(process.cwd(), relativePath), "utf8")
}

describe("media library and editor picker", () => {
  test("prisma schema includes media asset model and enums", () => {
    const schema = readWorkspaceFile("prisma/schema.prisma")

    expect(schema).toContain("enum MediaAssetType")
    expect(schema).toContain("enum MediaAssetVisibility")
    expect(schema).toContain("model MediaAsset")
    expect(schema).toContain("assetType   MediaAssetType")
    expect(schema).toContain("visibility  MediaAssetVisibility")
  })

  test("media upload action persists asset records", () => {
    const source = readWorkspaceFile("app/admin/actions.ts")

    expect(source).toContain("export async function uploadMediaAsset")
    expect(source).toContain("await prisma.mediaAsset.create")
    expect(source).toContain('folder: "songhay/editor"')
    expect(source).toContain('folder: "songhay/editor/videos"')
  })

  test("rich text field contains media picker popup and insert logic", () => {
    const source = readWorkspaceFile("components/admin/rich-text-field.tsx")

    expect(source).toContain("Thêm ảnh")
    expect(source).toContain("setShowMediaPicker(true)")
    expect(source).toContain("function insertMedia")
    expect(source).toContain("Chèn vào nội dung")
  })

  test("media library tab provides upload UI and listing", () => {
    const source = readWorkspaceFile("components/admin/media-library-tab.tsx")

    expect(source).toContain("Upload vào kho")
    expect(source).toContain("items.map")
    expect(source).toContain("Admin có thể lọc theo người upload")
  })
})
