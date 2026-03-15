import { revalidatePath } from "next/cache"
import Link from "next/link"

import { ConfirmActionForm } from "@/components/admin/confirm-action-form"
import { RichTextField } from "@/components/admin/rich-text-field"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { clearSessionCookie, requireAdminUser } from "@/lib/auth"
import { uploadImageToCloudinary } from "@/lib/cloudinary"
import { prisma } from "@/lib/prisma"
import { slugify } from "@/lib/slug"
import { cn } from "@/lib/utils"

export const revalidate = 0

type AdminTab = "overview" | "write" | "categories" | "comments" | "posts" | "trash"

const ADMIN_TABS: Array<{ key: AdminTab; label: string }> = [
  { key: "overview", label: "Tổng quan" },
  { key: "write", label: "Viết bài" },
  { key: "categories", label: "Chuyên mục" },
  { key: "comments", label: "Bình luận" },
  { key: "posts", label: "Kho bài" },
  { key: "trash", label: "Thùng rác" },
]

function getPlainTextFromHtml(value: string) {
  return value
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

async function uniquePostSlug(baseTitle: string) {
  const base = slugify(baseTitle)
  let candidate = base
  let index = 1

  while (true) {
    const found = await prisma.post.findUnique({ where: { slug: candidate }, select: { id: true } })
    if (!found) {
      return candidate
    }
    index += 1
    candidate = `${base}-${index}`
  }
}

async function uploadThumbnail(file: File | null) {
  if (!file || file.size === 0) {
    return null
  }

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  return uploadImageToCloudinary({
    buffer,
    filename: file.name,
    mimeType: file.type || "image/jpeg",
    folder: "songhay/thumbnails",
  })
}

type AdminPageProps = {
  searchParams?: Promise<{ tab?: string }>
}

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const admin = await requireAdminUser()
  const resolvedSearchParams = searchParams ? await searchParams : undefined
  const tabFromQuery = resolvedSearchParams?.tab
  const activeTab: AdminTab = ADMIN_TABS.some((item) => item.key === tabFromQuery)
    ? (tabFromQuery as AdminTab)
    : "overview"

  const [categories, posts, trashedPosts, pendingComments] = await Promise.all([
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.post.findMany({
      where: { isDeleted: false },
      include: { category: true },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
    prisma.post.findMany({
      where: { isDeleted: true },
      include: { category: true },
      orderBy: [{ deletedAt: "desc" }, { updatedAt: "desc" }],
      take: 30,
    }),
    prisma.comment.findMany({
      where: { isApproved: false },
      include: { post: { include: { category: true } } },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ])

  async function logoutAction() {
    "use server"
    await requireAdminUser()
    await clearSessionCookie()
  }

  async function createCategory(formData: FormData) {
    "use server"

    await requireAdminUser()

    const name = String(formData.get("name") || "").trim()
    const description = String(formData.get("description") || "").trim()

    if (!name) {
      return
    }

    const slug = slugify(name)
    await prisma.category.upsert({
      where: { slug },
      update: { name, description },
      create: { name, slug, description },
    })

    revalidatePath("/")
    revalidatePath("/admin")
  }

  async function createPost(formData: FormData) {
    "use server"

    await requireAdminUser()

    const title = String(formData.get("title") || "").trim()
    const excerpt = String(formData.get("excerpt") || "").trim()
    const content = String(formData.get("content") || "").trim()
    const plainContent = getPlainTextFromHtml(content)
    const categoryId = String(formData.get("categoryId") || "").trim()
    const seoTitle = String(formData.get("seoTitle") || "").trim() || null
    const seoDescription = String(formData.get("seoDescription") || "").trim() || null
    const ogImage = String(formData.get("ogImage") || "").trim() || null
    const videoEmbedUrl = String(formData.get("videoEmbedUrl") || "").trim() || null
    const isFeatured = formData.get("isFeatured") === "on"
    const isTrending = formData.get("isTrending") === "on"
    const isPublished = formData.get("isPublished") === "on"
    const thumbnailUpload = formData.get("thumbnailUpload")
    const thumbnailUrlInput = String(formData.get("thumbnailUrl") || "").trim()

    if (!title || !excerpt || !plainContent || !categoryId) {
      return
    }

    const slug = await uniquePostSlug(title)
    const thumbnailUrl =
      thumbnailUpload instanceof File && thumbnailUpload.size > 0
        ? await uploadThumbnail(thumbnailUpload)
        : thumbnailUrlInput || null

    await prisma.post.create({
      data: {
        title,
        slug,
        excerpt,
        content,
        categoryId,
        seoTitle,
        seoDescription,
        ogImage,
        videoEmbedUrl,
        isFeatured,
        isTrending,
        isPublished,
        thumbnailUrl,
      },
    })

    revalidatePath("/")
    revalidatePath("/admin")
  }

  async function updatePostFlags(formData: FormData) {
    "use server"

    await requireAdminUser()

    const postId = String(formData.get("postId") || "")
    const isFeatured = formData.get("isFeatured") === "on"
    const isTrending = formData.get("isTrending") === "on"
    const isPublished = formData.get("isPublished") === "on"
    const seoTitle = String(formData.get("seoTitle") || "").trim() || null
    const seoDescription = String(formData.get("seoDescription") || "").trim() || null

    if (!postId) {
      return
    }

    const updatedPost = await prisma.post.update({
      where: { id: postId },
      data: {
        isFeatured,
        isTrending,
        isPublished,
        seoTitle,
        seoDescription,
      },
      include: { category: true },
    })

    revalidatePath("/")
    revalidatePath("/admin")
    revalidatePath(`/${updatedPost.category.slug}`)
    revalidatePath(`/${updatedPost.category.slug}/${updatedPost.slug}`)
  }

  async function movePostToTrash(formData: FormData) {
    "use server"

    await requireAdminUser()

    const postId = String(formData.get("postId") || "")
    if (!postId) {
      return
    }

    const existingPost = await prisma.post.findUnique({
      where: { id: postId },
      select: {
        slug: true,
        category: {
          select: {
            slug: true,
          },
        },
      },
    })

    if (!existingPost) {
      return
    }

    await prisma.post.update({
      where: { id: postId },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        isPublished: false,
        isFeatured: false,
        isTrending: false,
      },
    })

    revalidatePath("/")
    revalidatePath("/admin")
    revalidatePath(`/${existingPost.category.slug}`)
    revalidatePath(`/${existingPost.category.slug}/${existingPost.slug}`)
  }

  async function restorePostFromTrash(formData: FormData) {
    "use server"

    await requireAdminUser()

    const postId = String(formData.get("postId") || "")
    if (!postId) {
      return
    }

    await prisma.post.update({
      where: { id: postId },
      data: {
        isDeleted: false,
        deletedAt: null,
      },
    })

    revalidatePath("/")
    revalidatePath("/admin")
  }

  async function deletePostPermanently(formData: FormData) {
    "use server"

    await requireAdminUser()

    const postId = String(formData.get("postId") || "")
    if (!postId) {
      return
    }

    await prisma.post.delete({ where: { id: postId } })

    revalidatePath("/")
    revalidatePath("/admin")
  }

  async function moderateComment(formData: FormData) {
    "use server"

    await requireAdminUser()

    const commentId = String(formData.get("commentId") || "")
    const action = String(formData.get("action") || "")

    if (!commentId || !["approve", "delete"].includes(action)) {
      return
    }

    if (action === "approve") {
      await prisma.comment.update({ where: { id: commentId }, data: { isApproved: true } })
    }

    if (action === "delete") {
      await prisma.comment.delete({ where: { id: commentId } })
    }

    revalidatePath("/admin")
  }

  const activeTabMeta = ADMIN_TABS.find((item) => item.key === activeTab) || ADMIN_TABS[0]

  return (
    <main className="min-h-screen bg-muted/30">
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/70">
        <div className="mx-auto flex w-full max-w-[1600px] items-center justify-between gap-4 px-4 py-3 md:px-6">
          <div className="space-y-1">
            <p className="text-muted-foreground text-xs font-semibold uppercase tracking-[0.2em]">Songhay CMS</p>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="hidden md:inline-flex">
              {admin.name}
            </Badge>
            <form action={logoutAction}>
              <Button type="submit" variant="ghost">Đăng xuất</Button>
            </form>
          </div>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-[1600px] gap-4 p-4 md:grid-cols-[250px_1fr] md:p-6">
        <aside className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Điều hướng CMS</CardTitle>
              <CardDescription>Tách theo từng tab để thao tác rõ ràng và nhanh hơn.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-1">
              {ADMIN_TABS.map((tab) => (
                <Button
                  key={tab.key}
                  asChild
                  className="w-full justify-start"
                  variant={activeTab === tab.key ? "secondary" : "ghost"}
                >
                  <Link href={`/admin?tab=${tab.key}`}>{tab.label}</Link>
                </Button>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Thống kê nhanh</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2 text-sm">
              <div className="flex items-center justify-between rounded-md border px-3 py-2">
                <span className="text-muted-foreground">Bài viết</span>
                <span className="font-semibold">{posts.length}</span>
              </div>
              <div className="flex items-center justify-between rounded-md border px-3 py-2">
                <span className="text-muted-foreground">Chuyên mục</span>
                <span className="font-semibold">{categories.length}</span>
              </div>
              <div className="flex items-center justify-between rounded-md border px-3 py-2">
                <span className="text-muted-foreground">Comment chờ duyệt</span>
                <span className="font-semibold">{pendingComments.length}</span>
              </div>
              <div className="flex items-center justify-between rounded-md border px-3 py-2">
                <span className="text-muted-foreground">Thùng rác</span>
                <span className="font-semibold">{trashedPosts.length}</span>
              </div>
            </CardContent>
          </Card>
        </aside>

        <section className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{activeTabMeta.label}</CardTitle>
            </CardHeader>
          </Card>

          {activeTab === "overview" ? (
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Bài viết</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-black">{posts.length}</p>
                  <p className="text-muted-foreground text-sm">Bài gần nhất trong hệ thống</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Chuyên mục</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-black">{categories.length}</p>
                  <p className="text-muted-foreground text-sm">Danh mục đang hoạt động</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Comment chờ duyệt</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className={cn("text-3xl font-black", pendingComments.length > 0 ? "text-amber-600" : "text-zinc-900")}>{pendingComments.length}</p>
                  <p className="text-muted-foreground text-sm">Cần xử lý bởi admin</p>
                </CardContent>
              </Card>
            </div>
          ) : null}

          {activeTab === "categories" ? (
            <Card>
              <CardHeader>
                <CardTitle>Tạo chuyên mục</CardTitle>
                <CardDescription>Tạo hoặc cập nhật chuyên mục bằng slug tự động.</CardDescription>
              </CardHeader>
              <CardContent>
                <form action={createCategory} className="max-w-xl space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="categoryName">Tên chuyên mục</Label>
                    <Input id="categoryName" name="name" placeholder="Ví dụ: Sống khỏe" required />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="categoryDesc">Mô tả</Label>
                    <Textarea id="categoryDesc" name="description" placeholder="Mô tả ngắn cho chuyên mục" />
                  </div>
                  <Button type="submit">Lưu chuyên mục</Button>
                </form>
              </CardContent>
            </Card>
          ) : null}

          {activeTab === "write" ? (
            <Card>
              <CardHeader>
                <CardTitle>Viết bài mới</CardTitle>
                <CardDescription>Editor rich-text đã được thêm để soạn bài tử tế hơn textarea thường.</CardDescription>
              </CardHeader>
              <CardContent>
                <form action={createPost} className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="postTitle">Tên bài viết</Label>
                    <Input id="postTitle" name="title" placeholder="Nhập tiêu đề" required />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="postExcerpt">Trích dẫn</Label>
                    <Textarea id="postExcerpt" name="excerpt" className="min-h-20" placeholder="Mô tả ngắn bài viết" required />
                  </div>

                  <div className="space-y-1.5">
                    <Label>Nội dung</Label>
                    <RichTextField name="content" placeholder="Viết nội dung bài báo tại đây..." />
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="categorySelect">Danh mục chính</Label>
                      <Select id="categorySelect" name="categoryId" required>
                        <option value="">Chọn chuyên mục</option>
                        {categories.map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="videoEmbed">Video embed URL</Label>
                      <Input id="videoEmbed" name="videoEmbedUrl" placeholder="https://www.youtube.com/embed/..." />
                    </div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="thumbnailUrl">Ảnh đại diện URL</Label>
                      <Input id="thumbnailUrl" name="thumbnailUrl" placeholder="https://..." />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="thumbnailUpload">Upload ảnh</Label>
                      <Input id="thumbnailUpload" name="thumbnailUpload" type="file" accept="image/*" />
                    </div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="seoTitle">SEO title</Label>
                      <Input id="seoTitle" name="seoTitle" />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="ogImage">OG image URL</Label>
                      <Input id="ogImage" name="ogImage" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="seoDescription">SEO description</Label>
                    <Textarea id="seoDescription" name="seoDescription" className="min-h-20" />
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-sm">
                    <label className="inline-flex items-center gap-2">
                      <input className="size-4 rounded border-input" name="isFeatured" type="checkbox" />
                      Tin nổi bật
                    </label>
                    <label className="inline-flex items-center gap-2">
                      <input className="size-4 rounded border-input" name="isTrending" type="checkbox" />
                      Tin đọc nhiều
                    </label>
                    <label className="inline-flex items-center gap-2">
                      <input className="size-4 rounded border-input" name="isPublished" type="checkbox" defaultChecked />
                      Xuất bản ngay
                    </label>
                  </div>

                  <Button type="submit" className="w-full">Đăng bài</Button>
                </form>
              </CardContent>
            </Card>
          ) : null}

          {activeTab === "comments" ? (
            <Card>
              <CardHeader>
                <CardTitle>Bình luận chờ duyệt</CardTitle>
                <CardDescription>Chỉ người dùng đã đăng nhập mới gửi được bình luận, tại đây admin duyệt hoặc xóa.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {pendingComments.length === 0 ? (
                  <p className="text-muted-foreground text-sm">Không có bình luận chờ duyệt.</p>
                ) : (
                  pendingComments.map((comment) => (
                    <div key={comment.id} className="rounded-lg border p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-semibold">{comment.authorName}</p>
                        <Badge variant="outline">/{comment.post.category.slug}/{comment.post.slug}</Badge>
                      </div>
                      <p className="mt-2 text-sm text-zinc-700">{comment.content}</p>
                      <div className="mt-3 flex gap-2">
                        <form action={moderateComment}>
                          <input type="hidden" name="commentId" value={comment.id} />
                          <input type="hidden" name="action" value="approve" />
                          <Button type="submit" size="sm">Duyệt</Button>
                        </form>
                        <form action={moderateComment}>
                          <input type="hidden" name="commentId" value={comment.id} />
                          <input type="hidden" name="action" value="delete" />
                          <Button type="submit" size="sm" variant="destructive">Xóa</Button>
                        </form>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          ) : null}

          {activeTab === "posts" ? (
            <Card>
              <CardHeader>
                <CardTitle>Kho bài viết</CardTitle>
                <CardDescription>Quản lý trạng thái bài viết và SEO trực tiếp trên bảng.</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tiêu đề</TableHead>
                      <TableHead>Danh mục</TableHead>
                      <TableHead>SEO</TableHead>
                      <TableHead>Thiết lập</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {posts.map((post) => (
                      <TableRow key={post.id}>
                        <TableCell>
                          <p className="font-semibold">{post.title}</p>
                          <p className="text-muted-foreground text-xs">/{post.category.slug}/{post.slug}</p>
                        </TableCell>
                        <TableCell>{post.category.name}</TableCell>
                        <TableCell>
                          <p className="max-w-xs truncate text-sm">{post.seoTitle || "Chưa có SEO title"}</p>
                          <p className="text-muted-foreground max-w-xs truncate text-xs">{post.seoDescription || "Chưa có SEO description"}</p>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-2">
                            <form action={updatePostFlags} className="space-y-2">
                              <input type="hidden" name="postId" value={post.id} />
                              <div className="flex flex-wrap gap-3 text-xs">
                                <label className="inline-flex items-center gap-1.5">
                                  <input className="size-4 rounded border-input" name="isFeatured" type="checkbox" defaultChecked={post.isFeatured} />
                                  Featured
                                </label>
                                <label className="inline-flex items-center gap-1.5">
                                  <input className="size-4 rounded border-input" name="isTrending" type="checkbox" defaultChecked={post.isTrending} />
                                  Trending
                                </label>
                                <label className="inline-flex items-center gap-1.5">
                                  <input className="size-4 rounded border-input" name="isPublished" type="checkbox" defaultChecked={post.isPublished} />
                                  Published
                                </label>
                              </div>
                              <Input name="seoTitle" defaultValue={post.seoTitle || ""} placeholder="SEO title" className="h-8" />
                              <Textarea name="seoDescription" defaultValue={post.seoDescription || ""} placeholder="SEO description" className="min-h-16" />
                              <Button type="submit" size="sm" variant="outline">Cập nhật</Button>
                            </form>

                            <div className="flex flex-wrap gap-2">                                <Link href={`/admin/edit/${post.id}`}>
                              <Button type="button" size="sm" variant="secondary">Sửa bài</Button>
                            </Link>                              <ConfirmActionForm
                              action={movePostToTrash}
                              fields={[{ name: "postId", value: post.id }]}
                              confirmMessage="Chuyển bài viết này vào thùng rác?"
                            >
                                <Button type="submit" size="sm" variant="destructive">Chuyển vào thùng rác</Button>
                              </ConfirmActionForm>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ) : null}

          {activeTab === "trash" ? (
            <Card>
              <CardHeader>
                <CardTitle>Thùng rác</CardTitle>
                <CardDescription>Bài viết đã xóa mềm sẽ nằm tại đây. Có thể khôi phục hoặc xóa vĩnh viễn.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {trashedPosts.length === 0 ? (
                  <p className="text-muted-foreground text-sm">Thùng rác đang trống.</p>
                ) : (
                  trashedPosts.map((post) => (
                    <div key={post.id} className="rounded-lg border p-3">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold">{post.title}</p>
                          <p className="text-muted-foreground text-xs">/{post.category.slug}/{post.slug}</p>
                          <p className="text-muted-foreground text-xs">
                            Đã xóa lúc: {post.deletedAt ? new Date(post.deletedAt).toLocaleString("vi-VN") : "Không rõ"}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <form action={restorePostFromTrash}>
                            <input type="hidden" name="postId" value={post.id} />
                            <Button type="submit" size="sm" variant="outline">Khôi phục</Button>
                          </form>
                          <ConfirmActionForm
                            action={deletePostPermanently}
                            fields={[{ name: "postId", value: post.id }]}
                            confirmMessage="Xóa vĩnh viễn bài viết này? Hành động này không thể hoàn tác."
                          >
                            <Button type="submit" size="sm" variant="destructive">Xóa vĩnh viễn</Button>
                          </ConfirmActionForm>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          ) : null}
        </section>
      </div>
    </main>
  )
}
