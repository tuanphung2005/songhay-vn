import { ArrowDown, ArrowUp } from "lucide-react"

import { ConfirmActionForm } from "@/components/admin/confirm-action-form"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

type CategoryManageRow = {
  id: string
  slug: string
  name: string
  parentId: string | null
  parent: {
    name: string
    slug: string
  } | null
  description: string | null
  _count: {
    posts: number
  }
}

type CategoriesTabProps = {
  categoriesForManage: CategoryManageRow[]
  movedCategoryId?: string
  movedDirection?: string
  createCategory: (formData: FormData) => Promise<void>
  updateCategory: (formData: FormData) => Promise<void>
  reorderCategory: (formData: FormData) => Promise<void>
  deleteCategory: (formData: FormData) => Promise<void>
}

export function CategoriesTab({
  categoriesForManage,
  movedCategoryId,
  movedDirection,
  createCategory,
  updateCategory,
  reorderCategory,
  deleteCategory,
}: CategoriesTabProps) {
  const rootCategories = categoriesForManage.filter((c) => !c.parentId)

  return (
    <div className="grid gap-4 lg:grid-cols-[340px_1fr]">
      <Card>
        <CardHeader>
          <CardTitle>Tạo chuyên mục</CardTitle>
          <CardDescription>Tạo mới chuyên mục hoặc chỉ mục phụ.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={createCategory} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="categoryName">Tên chuyên mục</Label>
              <Input id="categoryName" name="name" placeholder="Ví dụ: Sống khỏe" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="categoryParent">Danh mục cha (Tùy chọn)</Label>
              <Select id="categoryParent" name="parentId">
                <option value="">Không có (Danh mục gốc)</option>
                {rootCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="categoryDesc">Mô tả</Label>
              <Textarea id="categoryDesc" name="description" placeholder="Mô tả ngắn cho chuyên mục" />
            </div>
            <Button type="submit" className="w-full">Tạo chuyên mục</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Quản lý chuyên mục</CardTitle>
          <CardDescription>
            Có thể sửa hoặc xóa chuyên mục. Khi xóa chuyên mục có bài viết, bắt buộc chuyển bài sang chuyên mục khác.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {categoriesForManage.length === 0 ? (
            <p className="text-muted-foreground text-sm">Chưa có chuyên mục nào.</p>
          ) : (
            categoriesForManage.map((category, index) => (
              <div
                key={category.id}
                className={cn(
                  "rounded-lg border p-3 transition-all duration-300",
                  category.parentId ? "ml-6 border-l-4 border-l-stone-300 bg-stone-50/50" : "",
                  movedCategoryId === category.id ? "animate-pulse border-rose-300 ring-2 ring-rose-200" : ""
                )}
              >
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold">/{category.slug}</p>
                    {category.parent ? (
                      <Badge variant="outline" className="text-xs text-muted-foreground">
                        Thuộc: {category.parent.name}
                      </Badge>
                    ) : null}
                    <Badge variant="secondary">#{index + 1}</Badge>
                    {movedCategoryId === category.id ? (
                      <Badge variant="outline" className="text-rose-700">
                        {movedDirection === "up" ? "Vừa đẩy lên" : "Vừa đẩy xuống"}
                      </Badge>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-2">
                    <form action={reorderCategory}>
                      <input type="hidden" name="categoryId" value={category.id} />
                      <input type="hidden" name="direction" value="up" />
                      <Button
                        type="submit"
                        size="icon"
                        variant="outline"
                        className="size-8 transition-transform hover:-translate-y-0.5 active:translate-y-0"
                        disabled={index === 0}
                      >
                        <ArrowUp className="size-4" />
                      </Button>
                    </form>
                    <form action={reorderCategory}>
                      <input type="hidden" name="categoryId" value={category.id} />
                      <input type="hidden" name="direction" value="down" />
                      <Button
                        type="submit"
                        size="icon"
                        variant="outline"
                        className="size-8 transition-transform hover:translate-y-0.5 active:translate-y-0"
                        disabled={index === categoriesForManage.length - 1}
                      >
                        <ArrowDown className="size-4" />
                      </Button>
                    </form>
                    <Badge variant="outline">{category._count.posts} bài viết</Badge>
                  </div>
                </div>

                <form action={updateCategory} className="space-y-2">
                  <input type="hidden" name="categoryId" value={category.id} />
                  <div className="grid gap-2 md:grid-cols-3">
                    <Input name="name" defaultValue={category.name} placeholder="Tên chuyên mục" required />
                    <Select name="parentId" defaultValue={category.parentId || ""}>
                      <option value="">Không có (Kiểu gốc)</option>
                      {rootCategories
                        .filter((c) => c.id !== category.id)
                        .map((c) => (
                          <option key={c.id} value={c.id}>
                            Thuộc: {c.name}
                          </option>
                        ))}
                    </Select>
                    <Input name="description" defaultValue={category.description || ""} placeholder="Mô tả" />
                  </div>
                  <Button type="submit" size="sm" variant="outline">Lưu thay đổi</Button>
                </form>

                <ConfirmActionForm
                  action={deleteCategory}
                  className="mt-3 space-y-2"
                  fields={[{ name: "categoryId", value: category.id }]}
                  confirmMessage={
                    category._count.posts > 0
                      ? `Xóa chuyên mục ${category.name}? ${category._count.posts} bài viết sẽ được chuyển sang chuyên mục đã chọn.`
                      : `Xóa chuyên mục ${category.name}?`
                  }
                >
                  {category._count.posts > 0 ? (
                    <div className="space-y-1">
                      <Label htmlFor={`moveTo-${category.id}`}>Chuyển {category._count.posts} bài sang chuyên mục</Label>
                      <Select id={`moveTo-${category.id}`} name="moveToCategoryId" required>
                        <option value="">Chọn chuyên mục đích</option>
                        {categoriesForManage
                          .filter((item) => item.id !== category.id)
                          .map((item) => (
                            <option key={item.id} value={item.id}>
                              {item.name}
                            </option>
                          ))}
                      </Select>
                    </div>
                  ) : null}
                  <Button
                    type="submit"
                    size="sm"
                    variant="destructive"
                    disabled={categoriesForManage.length <= 1 || (category._count.posts > 0 && categoriesForManage.length <= 1)}
                  >
                    Xóa chuyên mục
                  </Button>
                </ConfirmActionForm>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
