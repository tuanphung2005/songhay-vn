import { describe, expect, test } from "bun:test"
import { readFileSync } from "node:fs"
import { join } from "node:path"

function readWorkspaceFile(relativePath: string) {
  return readFileSync(join(process.cwd(), relativePath), "utf8")
}

describe("media delete and labeling", () => {
  test("media library supports delete action and moderation dialog", () => {
    const source = readWorkspaceFile("components/admin/media-library-tab.tsx")

    expect(source).toContain("handleDelete")
    expect(source).toContain("AlertDialog")
    expect(source).toContain("Xóa media khỏi kho dữ liệu?")
    expect(source).toContain('method: "DELETE"')
  })

  test("upload APIs persist displayName", () => {
    const imageSource = readWorkspaceFile("app/api/uploads/image/route.ts")
    const videoSource = readWorkspaceFile("app/api/uploads/video/route.ts")

    expect(imageSource).toContain("displayNameInput")
    expect(imageSource).toContain("displayName:")
    expect(videoSource).toContain("displayNameInput")
    expect(videoSource).toContain("displayName:")
  })

  test("image and video endpoints support paginated searchable GET listing", () => {
    const imageSource = readWorkspaceFile("app/api/uploads/image/route.ts")
    const videoSource = readWorkspaceFile("app/api/uploads/video/route.ts")

    expect(imageSource).toContain("export async function GET")
    expect(imageSource).toContain("pageSize")
    expect(imageSource).toContain("search")
    expect(imageSource).toContain("uploaderId")
    expect(imageSource).toContain("uploaderOptions")
    expect(imageSource).toContain("pagination")

    expect(videoSource).toContain("export async function GET")
    expect(videoSource).toContain("pageSize")
    expect(videoSource).toContain("search")
    expect(videoSource).toContain("uploaderId")
    expect(videoSource).toContain("uploaderOptions")
    expect(videoSource).toContain("uploaderIdFilter")
    expect(videoSource).not.toContain("...(isAdmin ? {} : { uploaderId: session.userId })")
    expect(videoSource).toContain("pagination")
  })

  test("media delete endpoint exists with auth and ownership checks", () => {
    const source = readWorkspaceFile("app/api/media/[id]/route.ts")

    expect(source).toContain("export async function DELETE")
    expect(source).toContain("decodeSession")
    expect(source).toContain("!canDeleteAnyMedia(session.role) && asset.uploaderId !== session.userId")
    expect(source).toContain("await prisma.mediaAsset.delete")
  })

  test("schema and picker consume displayName field", () => {
    const schema = readWorkspaceFile("prisma/schema.prisma")
    const dataSource = readWorkspaceFile("app/admin/data-loaders/shared.ts")
    const editorSource = readWorkspaceFile("components/admin/media-picker/library-tab.tsx")

    expect(schema).toContain("displayName String?")
    expect(dataSource).toContain("displayName: true")
    expect(editorSource).toContain("asset.displayName || asset.filename")
    expect(editorSource).toContain('useState<"ALL" | "IMAGE" | "VIDEO">("ALL")')
  })

  test("media library UI has filter/search and pagination controls", () => {
    const source = readWorkspaceFile("components/admin/media-library-tab.tsx")

    expect(source).toContain('const [filterType, setFilterType] = useState<"image" | "video">("image")')
    expect(source).toContain("handleSearchSubmit")
    expect(source).toContain("goToPage")
    expect(source).toContain("Lọc theo người upload")
    expect(source).toContain("uploaderFilter")
    expect(source).toContain("/api/uploads/video")
    expect(source).toContain("/api/uploads/image")
  })
})
