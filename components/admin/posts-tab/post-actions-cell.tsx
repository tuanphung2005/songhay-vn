import Link from "next/link"

import { ConfirmActionForm } from "@/components/admin/confirm-action-form"
import { PendingSubmitButton } from "@/components/admin/pending-submit-button"
import { Button } from "@/components/ui/button"

import { canEditPost } from "./types"
import type { PostActions, PostPermissions, PostRow } from "./types"

type PostActionsCellProps = {
  post: PostRow
} & PostPermissions &
  PostActions

export function PostActionsCell({
  post,
  canSubmitPendingReview,
  canSubmitPendingPublish,
  canReviewPending,
  canPublishNow,
  canEditDraft,
  canEditPendingReview,
  canEditPendingPublish,
  canEditPublished,
  submitPostToPendingReview,
  promotePostToPendingPublish,
  approvePendingPost,
  rejectPendingPost,
  returnPostToDraft,
  returnPostToPendingReview,
  returnPostToPendingPublish,
  movePostToTrash,
}: PostActionsCellProps) {
  const editable = canEditPost(post, {
    canEditDraft,
    canEditPendingReview,
    canEditPendingPublish,
    canEditPublished,
  })

  const btn = "h-7 px-2.5 text-xs"

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {/* ── Workflow ── */}
      {canSubmitPendingReview &&
        (post.editorialStatus === "DRAFT" || post.editorialStatus === "REJECTED") && (
          <ConfirmActionForm
            action={submitPostToPendingReview}
            fields={[{ name: "postId", value: post.id }]}
            confirmMessage="Chuyển bài này lên chờ duyệt?"
          >
            <PendingSubmitButton type="submit" size="sm" variant="outline" className={btn} pendingText="Đang chuyển...">
              Lên duyệt
            </PendingSubmitButton>
          </ConfirmActionForm>
        )}

      {(canReviewPending || canSubmitPendingPublish) && post.editorialStatus === "PENDING_REVIEW" && (
        <ConfirmActionForm
          action={promotePostToPendingPublish}
          fields={[{ name: "postId", value: post.id }]}
          confirmMessage="Chuyển bài này lên chờ xuất bản?"
        >
          <PendingSubmitButton type="submit" size="sm" className={`${btn} bg-sky-600 hover:bg-sky-700`} pendingText="Đang chuyển...">
            Lên đăng
          </PendingSubmitButton>
        </ConfirmActionForm>
      )}

      {canPublishNow && post.editorialStatus === "PENDING_REVIEW" && (
        <ConfirmActionForm
          action={approvePendingPost}
          fields={[{ name: "postId", value: post.id }]}
          confirmMessage="Xuất bản ngay bài viết này?"
        >
          <PendingSubmitButton type="submit" size="sm" className={`${btn} bg-emerald-600 hover:bg-emerald-700`} pendingText="Đang đăng...">
            Xuất bản ngay
          </PendingSubmitButton>
        </ConfirmActionForm>
      )}

      {canPublishNow && post.editorialStatus === "PENDING_PUBLISH" && (
        <ConfirmActionForm
          action={approvePendingPost}
          fields={[{ name: "postId", value: post.id }]}
          confirmMessage="Xuất bản bài viết này?"
        >
          <PendingSubmitButton type="submit" size="sm" className={`${btn} bg-emerald-600 hover:bg-emerald-700`} pendingText="Đang đăng...">
            Xuất bản
          </PendingSubmitButton>
        </ConfirmActionForm>
      )}

      {canReviewPending &&
        (post.editorialStatus === "PENDING_REVIEW" || post.editorialStatus === "PENDING_PUBLISH") && (
          <ConfirmActionForm
            action={rejectPendingPost}
            fields={[{ name: "postId", value: post.id }]}
            confirmMessage="Từ chối bài viết này?"
          >
            <PendingSubmitButton type="submit" size="sm" variant="destructive" className={btn} pendingText="Đang từ chối...">
              Từ chối
            </PendingSubmitButton>
          </ConfirmActionForm>
        )}

      {canReviewPending && post.editorialStatus === "PENDING_PUBLISH" && (
        <ConfirmActionForm
          action={returnPostToPendingReview}
          fields={[{ name: "postId", value: post.id }]}
          confirmMessage="Chuyển bài này về chờ duyệt?"
        >
          <PendingSubmitButton type="submit" size="sm" variant="outline" className={btn} pendingText="Đang chuyển...">
            Về duyệt
          </PendingSubmitButton>
        </ConfirmActionForm>
      )}

      {(canReviewPending || canPublishNow) && post.editorialStatus !== "DRAFT" && (
        <ConfirmActionForm
          action={returnPostToDraft}
          fields={[{ name: "postId", value: post.id }]}
          confirmMessage="Trả bài này về kho nháp?"
        >
          <PendingSubmitButton type="submit" size="sm" variant="outline" className={btn} pendingText="Đang trả về...">
            Về kho
          </PendingSubmitButton>
        </ConfirmActionForm>
      )}

      {canPublishNow && post.editorialStatus === "PUBLISHED" && (
        <ConfirmActionForm
          action={returnPostToPendingPublish}
          fields={[{ name: "postId", value: post.id }]}
          confirmMessage="Trả bài này về chờ xuất bản?"
        >
          <PendingSubmitButton type="submit" size="sm" variant="outline" className={btn} pendingText="Đang trả về...">
            Bỏ đăng
          </PendingSubmitButton>
        </ConfirmActionForm>
      )}

      {/* ── Divider ── */}
      <span className="h-4 w-px shrink-0 bg-zinc-200" />

      {/* ── Edit / Preview ── */}
      {editable ? (
        <Link href={`/admin/edit/${post.id}`}>
          <Button size="sm" variant="secondary" className={btn}>
            Sửa bài
          </Button>
        </Link>
      ) : (
        <Link href={`/admin/preview/${post.id}`} target="_blank" rel="noreferrer">
          <Button size="sm" variant="outline" className={btn}>
            Xem trước
          </Button>
        </Link>
      )}

      {/* ── View live ── */}
      <a href={`/${post.category.slug}/${post.slug}`} target="_blank" rel="noopener noreferrer">
        <Button size="sm" variant="outline" className={btn}>
          Xem bài
        </Button>
      </a>

      {/* ── Trash ── */}
      <ConfirmActionForm
        action={movePostToTrash}
        fields={[
          { name: "postId", value: post.id },
          { name: "sourceTab", value: "posts" },
        ]}
        confirmMessage="Xóa bài viết này vào thùng rác?"
      >
        <PendingSubmitButton
          type="submit"
          size="sm"
          variant="destructive"
          className={btn}
          pendingText="Đang xóa..."
        >
          Xóa
        </PendingSubmitButton>
      </ConfirmActionForm>
    </div>
  )
}
