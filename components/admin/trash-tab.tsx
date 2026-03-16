import { ConfirmActionForm } from "@/components/admin/confirm-action-form"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

type TrashedPost = {
  id: string
  title: string
  slug: string
  deletedAt: Date | null
  category: {
    slug: string
  }
}

type TrashTabProps = {
  trashedPosts: TrashedPost[]
  restorePostFromTrash: (formData: FormData) => Promise<void>
  deletePostPermanently: (formData: FormData) => Promise<void>
}

export function TrashTab({ trashedPosts, restorePostFromTrash, deletePostPermanently }: TrashTabProps) {
  return (
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
  )
}
