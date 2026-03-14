import { mkdir, writeFile } from "node:fs/promises"
import path from "node:path"

import { revalidatePath } from "next/cache"

import { Button } from "@/components/ui/button"
import { prisma } from "@/lib/prisma"
import { slugify } from "@/lib/slug"

export const revalidate = 0

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

  const extension = file.name.split(".").pop() || "jpg"
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`
  const uploadDir = path.join(process.cwd(), "public", "uploads")

  await mkdir(uploadDir, { recursive: true })
  await writeFile(path.join(uploadDir, filename), buffer)

  return `/uploads/${filename}`
}

export default async function AdminPage() {
  const [categories, posts] = await Promise.all([
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.post.findMany({
      include: { category: true },
      orderBy: { createdAt: "desc" },
      take: 30,
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

    if (!title || !excerpt || !content || !categoryId) {
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

  return (
    <main className="mx-auto w-full max-w-7xl space-y-8 px-4 py-8 md:px-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-black">CMS quản trị Songhay.vn</h1>
        <p className="text-sm text-zinc-600">
          Tạo bài viết, gán chuyên mục, upload thumbnail, quản lý featured posts và SEO fields.
        </p>
      </header>

      <section className="grid gap-6 lg:grid-cols-2">
        <form action={createCategory} className="space-y-3 border border-zinc-200 bg-white p-4">
          <h2 className="text-xl font-bold">Tạo / cập nhật chuyên mục</h2>
          <input name="name" placeholder="Tên chuyên mục" className="w-full border border-zinc-300 px-3 py-2" required />
          <textarea
            name="description"
            placeholder="Mô tả chuyên mục"
            className="h-24 w-full border border-zinc-300 px-3 py-2"
          />
          <Button className="rounded-none bg-rose-600 text-white hover:bg-rose-700">Lưu chuyên mục</Button>
        </form>

        <form action={createPost} className="space-y-3 border border-zinc-200 bg-white p-4">
          <h2 className="text-xl font-bold">Tạo bài viết mới</h2>
          <input name="title" placeholder="Tiêu đề" className="w-full border border-zinc-300 px-3 py-2" required />
          <textarea name="excerpt" placeholder="Sapo" className="h-20 w-full border border-zinc-300 px-3 py-2" required />
          <textarea
            name="content"
            placeholder="Nội dung bài viết"
            className="h-36 w-full border border-zinc-300 px-3 py-2"
            required
          />
          <select name="categoryId" className="w-full border border-zinc-300 px-3 py-2" required>
            <option value="">Chọn chuyên mục</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          <input name="thumbnailUrl" placeholder="Thumbnail URL (tùy chọn)" className="w-full border border-zinc-300 px-3 py-2" />
          <input name="thumbnailUpload" type="file" accept="image/*" className="w-full border border-zinc-300 px-3 py-2" />
          <input name="videoEmbedUrl" placeholder="Video embed URL (YouTube iframe src)" className="w-full border border-zinc-300 px-3 py-2" />
          <input name="seoTitle" placeholder="SEO title" className="w-full border border-zinc-300 px-3 py-2" />
          <textarea
            name="seoDescription"
            placeholder="SEO description"
            className="h-20 w-full border border-zinc-300 px-3 py-2"
          />
          <input name="ogImage" placeholder="OpenGraph image URL" className="w-full border border-zinc-300 px-3 py-2" />

          <div className="flex flex-wrap gap-4 text-sm">
            <label className="inline-flex items-center gap-2">
              <input name="isFeatured" type="checkbox" /> Featured homepage
            </label>
            <label className="inline-flex items-center gap-2">
              <input name="isTrending" type="checkbox" /> Trending
            </label>
            <label className="inline-flex items-center gap-2">
              <input name="isPublished" type="checkbox" defaultChecked /> Published
            </label>
          </div>

          <Button className="rounded-none bg-rose-600 text-white hover:bg-rose-700">Đăng bài</Button>
        </form>
      </section>

      <section className="space-y-3 border border-zinc-200 bg-white p-4">
        <h2 className="text-xl font-bold">Quản lý featured/trending + SEO</h2>
        <div className="space-y-4">
          {posts.map((post) => (
            <form key={post.id} action={updatePostFlags} className="space-y-2 border border-zinc-200 p-3">
              <input type="hidden" name="postId" value={post.id} />
              <p className="font-bold text-zinc-900">{post.title}</p>
              <p className="text-xs text-zinc-500">
                /{post.category.slug}/{post.slug}
              </p>
              <div className="flex flex-wrap gap-4 text-sm">
                <label className="inline-flex items-center gap-2">
                  <input name="isFeatured" type="checkbox" defaultChecked={post.isFeatured} /> Featured
                </label>
                <label className="inline-flex items-center gap-2">
                  <input name="isTrending" type="checkbox" defaultChecked={post.isTrending} /> Trending
                </label>
              </div>
              <input
                name="seoTitle"
                defaultValue={post.seoTitle || ""}
                placeholder="SEO title"
                className="w-full border border-zinc-300 px-3 py-2"
              />
              <textarea
                name="seoDescription"
                defaultValue={post.seoDescription || ""}
                placeholder="SEO description"
                className="h-20 w-full border border-zinc-300 px-3 py-2"
              />
              <Button size="sm" className="rounded-none bg-zinc-900 text-white hover:bg-zinc-700">
                Cập nhật bài
              </Button>
            </form>
          ))}
        </div>
      </section>
    </main>
  )
}
