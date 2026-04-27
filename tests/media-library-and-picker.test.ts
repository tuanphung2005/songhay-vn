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
    expect(schema).toContain("@default(SHARED)")
  })

  test("media upload action persists asset records", () => {
    const source = readWorkspaceFile("app/admin/actions/media.ts")

    expect(source).toContain("export async function uploadMediaAsset")
    expect(source).toContain("await prisma.mediaAsset.create")
    expect(source).toContain('folder: "songhay/editor"')
    expect(source).toContain('folder: "songhay/editor/videos"')
  })

  test("rich text field contains media picker popup and insert logic", () => {
    const source = readWorkspaceFile("components/admin/rich-text-field/index.tsx")

    expect(source).toContain("Thêm media")
    expect(source).toContain("setShowMediaPicker(true)")
    expect(source).toContain("function insertMedia")
    expect(source).toContain("<MediaPicker")
    expect(source).toContain("onSelect={insertMedia}")

    // Check specific snippets for image and video
    expect(source).toContain('asset.assetType === "IMAGE"')
    expect(source).toContain('<figure class="image')
    expect(source).toContain("<figcaption>")

    expect(source).toContain('<div class="video-wrap')
    expect(source).toContain("<video controls")
  })

  test("media library tab provides upload UI and listing", () => {
    const source = readWorkspaceFile("components/admin/media-library-tab.tsx")

    expect(source).toContain("+ Tải lên mới")
    expect(source).toContain("Đẩy lên Kho Media")
    expect(source).toContain("items.map")
    expect(source).toContain("Danh sách quy chuẩn")
    expect(source).toContain("Tất cả loại media")
    expect(source).toContain("Đang dùng ở")
    expect(source).toContain("getUsagePreviewItems")
    expect(source).toContain("getUsageItemHref")
  })
})
