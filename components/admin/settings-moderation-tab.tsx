import { PendingSubmitButton } from "@/components/admin/pending-submit-button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type ForbiddenKeywordRow = {
  id: string
  term: string
  createdAt: Date
}

type SeoKeywordRow = {
  id: string
  keyword: string
  normalizedKeyword: string
  postCount: number
  updatedAt: Date
}

type SettingsModerationTabProps = {
  forbiddenKeywords: ForbiddenKeywordRow[]
  seoKeywords: SeoKeywordRow[]
  addForbiddenKeyword: (formData: FormData) => Promise<void>
  deleteForbiddenKeyword: (formData: FormData) => Promise<void>
  addSeoKeyword: (formData: FormData) => Promise<void>
  deleteSeoKeyword: (formData: FormData) => Promise<void>
}

export function SettingsModerationTab({
  forbiddenKeywords,
  seoKeywords,
  addForbiddenKeyword,
  deleteForbiddenKeyword,
  addSeoKeyword,
  deleteSeoKeyword,
}: SettingsModerationTabProps) {
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <Card className="h-full">
        <CardContent className="flex flex-col gap-4 pt-6">
          <p className="text-sm font-semibold">Bộ từ cấm cho bình luận ({forbiddenKeywords.length})</p>
          <form action={addForbiddenKeyword} className="flex flex-wrap items-end gap-2">
            <div className="min-w-65 flex-1 space-y-1.5">
              <Label htmlFor="forbiddenTerm">Thêm từ/cụm từ cấm</Label>
              <Input id="forbiddenTerm" name="term" placeholder="Ví dụ: lừa đảo" required />
            </div>
            <PendingSubmitButton type="submit" pendingText="Đang lưu...">Thêm từ cấm</PendingSubmitButton>
          </form>

          {forbiddenKeywords.length === 0 ? (
            <p className="text-muted-foreground text-sm">Chưa có từ cấm nào được cấu hình.</p>
          ) : (
            <div className="max-h-96 space-y-2 overflow-y-auto pr-1">
              {forbiddenKeywords.map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-3 rounded-md border px-3 py-2">
                  <div className="flex min-w-0 flex-wrap items-center gap-2">
                    <Badge variant="outline">{item.term}</Badge>
                    <span className="text-muted-foreground text-xs">
                      {new Date(item.createdAt).toLocaleString("vi-VN")}
                    </span>
                  </div>
                  <form action={deleteForbiddenKeyword}>
                    <input type="hidden" name="forbiddenKeywordId" value={item.id} />
                    <PendingSubmitButton type="submit" variant="outline" pendingText="..." className="h-8 px-3 text-xs">
                      Xóa
                    </PendingSubmitButton>
                  </form>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="h-full">
        <CardContent className="flex flex-col gap-4 pt-6">
          <p className="text-sm font-semibold">Kho từ khóa SEO ({seoKeywords.length})</p>
          <form action={addSeoKeyword} className="flex flex-wrap items-end gap-2">
            <div className="min-w-65 flex-1 space-y-1.5">
              <Label htmlFor="seoKeyword">Thêm từ khóa SEO</Label>
              <Input id="seoKeyword" name="keyword" placeholder="Ví dụ: tử vi 12 con giáp" required />
            </div>
            <PendingSubmitButton type="submit" pendingText="Đang lưu...">Thêm từ khóa</PendingSubmitButton>
          </form>

          {seoKeywords.length === 0 ? (
            <p className="text-muted-foreground text-sm">Chưa có từ khóa SEO nào trong hệ thống.</p>
          ) : (
            <div className="max-h-96 space-y-2 overflow-y-auto pr-1">
              {seoKeywords.map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-3 rounded-md border px-3 py-2">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{item.keyword}</p>
                    <p className="text-muted-foreground text-xs">
                      Chuẩn hóa: {item.normalizedKeyword} · Dùng ở {item.postCount} bài · cập nhật {new Date(item.updatedAt).toLocaleString("vi-VN")}
                    </p>
                  </div>
                  <form action={deleteSeoKeyword}>
                    <input type="hidden" name="seoKeywordId" value={item.id} />
                    <PendingSubmitButton type="submit" variant="outline" pendingText="..." className="h-8 px-3 text-xs">
                      Xóa
                    </PendingSubmitButton>
                  </form>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
