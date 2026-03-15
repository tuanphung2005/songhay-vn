"use client"

import Link from "next/link"
import { FormEvent, useState } from "react"

import { Button } from "@/components/ui/button"

type CommentFormProps = {
  postId: string
  currentUser: {
    id: string
    name: string
  } | null
}

export function CommentForm({ postId, currentUser }: CommentFormProps) {
  const [content, setContent] = useState("")
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!currentUser) {
      setStatus("error")
      return
    }

    setStatus("loading")

    try {
      const response = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId, content }),
      })

      if (!response.ok) {
        throw new Error("Không thể gửi bình luận")
      }

      setContent("")
      setStatus("success")
    } catch {
      setStatus("error")
    }
  }

  if (!currentUser) {
    return (
      <section className="space-y-3 border border-zinc-200 bg-white p-4">
        <h3 className="text-xl font-bold">Bình luận</h3>
        <p className="text-sm text-zinc-600">Bạn cần đăng nhập để gửi bình luận.</p>
        <Link
          href="/login"
          className="inline-flex h-10 items-center rounded-md bg-rose-600 px-4 text-sm font-semibold text-white hover:bg-rose-700"
        >
          Đăng nhập ngay
        </Link>
      </section>
    )
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3 border border-zinc-200 bg-white p-4">
      <h3 className="text-xl font-bold">Bình luận</h3>
      <p className="text-sm text-zinc-600">
        Đăng nhập với tên: <span className="font-semibold text-zinc-800">{currentUser.name}</span>
      </p>
      <textarea
        value={content}
        onChange={(event) => setContent(event.target.value)}
        placeholder="Nội dung bình luận"
        className="h-28 w-full border border-zinc-300 px-3 py-2"
        required
      />
      <Button type="submit" className="rounded-none bg-rose-600 text-white hover:bg-rose-700" disabled={status === "loading"}>
        {status === "loading" ? "Đang gửi..." : "Gửi bình luận"}
      </Button>
      {status === "success" ? <p className="text-sm text-emerald-600">Đã gửi bình luận. Chờ duyệt trước khi hiển thị.</p> : null}
      {status === "error" ? <p className="text-sm text-rose-600">Gửi bình luận thất bại. Vui lòng thử lại.</p> : null}
    </form>
  )
}
