import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PendingSubmitButton } from "@/components/admin/pending-submit-button"

type PendingComment = {
  id: string
  authorName: string
  content: string
  post: {
    slug: string
    category: {
      slug: string
    }
  }
}

type CommentsTabProps = {
  pendingComments: PendingComment[]
  moderateComment: (formData: FormData) => Promise<void>
}

export function CommentsTab({ pendingComments, moderateComment }: CommentsTabProps) {
  return (
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
                  <PendingSubmitButton type="submit" size="sm" pendingText="Đang duyệt...">Duyệt</PendingSubmitButton>
                </form>
                <form action={moderateComment}>
                  <input type="hidden" name="commentId" value={comment.id} />
                  <input type="hidden" name="action" value="delete" />
                  <PendingSubmitButton type="submit" size="sm" variant="destructive" pendingText="Đang xóa...">Xóa</PendingSubmitButton>
                </form>
                <Button asChild variant="outline" size="sm" className="ml-auto">
                  <Link href={`/${comment.post.category.slug}/${comment.post.slug}`} target="_blank">
                    Xem bài viết
                  </Link>
                </Button>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}
