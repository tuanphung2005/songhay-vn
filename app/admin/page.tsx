import { revalidatePath } from "next/cache"
import Link from "next/link"
import type { LucideIcon } from "lucide-react"
import { Activity, FolderKanban, LayoutDashboard, MessageSquareMore, Newspaper, PenSquare, ShieldCheck, Trash2 } from "lucide-react"

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
import { requireAdminUser } from "@/lib/auth"
import { uploadImageToCloudinary } from "@/lib/cloudinary"
import { prisma } from "@/lib/prisma"
import { slugify } from "@/lib/slug"
import { cn } from "@/lib/utils"

export const revalidate = 0

type AdminTab = "overview" | "write" | "categories" | "comments" | "posts" | "trash"

const ADMIN_TABS: Array<{ key: AdminTab; label: string; description: string; icon: LucideIcon }> = [
  { key: "overview", label: "Tổng quan", description: "Bức tranh tổng quan trạng thái CMS", icon: LayoutDashboard },
  { key: "write", label: "Viết bài", description: "Soạn và xuất bản nội dung mới", icon: PenSquare },
  { key: "categories", label: "Chuyên mục", description: "Quản lý cấu trúc chuyên mục", icon: FolderKanban },
  { key: "comments", label: "Bình luận", description: "Duyệt và kiểm soát thảo luận", icon: MessageSquareMore },
  { key: "posts", label: "Kho bài", description: "Chỉnh sửa và tối ưu nội dung", icon: Newspaper },
  { key: "trash", label: "Thùng rác", description: "Khôi phục hoặc xóa vĩnh viễn", icon: Trash2 },
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
  await requireAdminUser()

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

  async function createCategory(formData: FormData) {
    "use server"

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
  const ActiveTabIcon = activeTabMeta.icon

  const overviewStats = [
    {
      key: "posts",
      label: "Bài viết",
      value: posts.length,
      note: "Bài gần nhất trong hệ thống",
      icon: Newspaper,
      tone: "text-sky-600",
    },
    {
      key: "categories",
      label: "Chuyên mục",
      value: categories.length,
      note: "Danh mục đang hoạt động",
      icon: FolderKanban,
      tone: "text-violet-600",
    },
    {
      key: "comments",
      label: "Comment chờ duyệt",
      value: pendingComments.length,
      note: "Cần xử lý bởi admin",
      icon: MessageSquareMore,
      tone: pendingComments.length > 0 ? "text-amber-600" : "text-zinc-900",
    },
  ]

  return (
    <main className="min-h-screen bg-muted/30">
      <header className="border-b bg-white/90 backdrop-blur supports-backdrop-filter:bg-white/80">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-4 md:px-6">
          <div>
            <p className="text-muted-foreground text-xs font-semibold uppercase tracking-[0.2em]">Songhay CMS</p>
            <h1 className="mt-1 text-xl font-black text-zinc-900 md:text-2xl">Bảng điều khiển quản trị</h1>
          </div>
          <Badge variant="secondary" className="hidden h-7 items-center gap-1.5 px-3 md:inline-flex">
            <ShieldCheck className="size-3.5" />
            Quyền quản trị
          </Badge>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-7xl gap-4 p-4 md:grid-cols-[280px_1fr] md:p-6">
        <aside className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Điều hướng CMS</CardTitle>
              <CardDescription>Chuyển nhanh theo nghiệp vụ quản trị.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-1.5">
              {ADMIN_TABS.map((tab) => (
                (() => {
                  const TabIcon = tab.icon
                  return (
                    <Button
                      key={tab.key}
                      asChild
                      className="h-10 w-full justify-start gap-2.5"
                      variant={activeTab === tab.key ? "secondary" : "ghost"}
                    >
                      <Link href={`/admin?tab=${tab.key}`}>
                        <TabIcon className="size-4" />
                        {tab.label}
                      </Link>
                    </Button>
                  )
                })()
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Snapshot hệ thống</CardTitle>
              <CardDescription>Những chỉ số cần theo dõi mỗi ngày.</CardDescription>
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
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div className="space-y-1">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <ActiveTabIcon className="size-5 text-zinc-700" />
                  {activeTabMeta.label}
                </CardTitle>
                <CardDescription>{activeTabMeta.description}</CardDescription>
              </div>
              <Badge variant="outline" className="hidden md:inline-flex">
                <Activity className="mr-1.5 size-3.5" />
                Live data
              </Badge>
            </CardHeader>
          </Card>

          {activeTab === "overview" ? (
            <div className="grid gap-4 md:grid-cols-3">
              {overviewStats.map((item) => {
                const ItemIcon = item.icon
                return (
                  <Card key={item.key}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">{item.label}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-end justify-between gap-3">
                        <div>
                          <p className={cn("text-3xl font-black", item.tone)}>{item.value}</p>
                          <p className="text-muted-foreground text-sm">{item.note}</p>
                        </div>
                        <div className="rounded-md border bg-zinc-50 p-2">
                          <ItemIcon className={cn("size-5", item.tone)} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
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
                <CardDescription>Người dùng có thể gửi bình luận tự do, tại đây admin duyệt hoặc xóa.</CardDescription>
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

                            <div className="flex flex-wrap gap-2">
                              <Link href={`/admin/edit/${post.id}`}>
                                <Button type="button" size="sm" variant="secondary">Sửa bài</Button>
                              </Link>
                              <ConfirmActionForm
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
