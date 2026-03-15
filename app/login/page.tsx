import Link from "next/link"
import { redirect } from "next/navigation"

import { setSessionCookie } from "@/lib/auth"
import { verifyPassword } from "@/lib/password"
import { prisma } from "@/lib/prisma"

export default function LoginPage() {
  async function loginAction(formData: FormData) {
    "use server"

    const email = String(formData.get("email") || "").trim().toLowerCase()
    const password = String(formData.get("password") || "")

    if (!email || !password) {
      redirect("/login?error=missing")
    }

    const user = await prisma.user.findUnique({ where: { email } })

    if (!user || !verifyPassword(password, user.passwordHash)) {
      redirect("/login?error=invalid")
    }

    await setSessionCookie(user.id, user.role)

    if (user.role === "ADMIN") {
      redirect("/admin")
    }

    redirect("/")
  }

  return (
    <main className="mx-auto flex min-h-[70vh] w-full max-w-7xl items-center justify-center px-4 py-10 md:px-6">
      <section className="w-full max-w-md space-y-5 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <header className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-rose-600">Songhay CMS</p>
          <h1 className="text-2xl font-black text-zinc-900">Đăng nhập hệ thống</h1>
          <p className="text-sm text-zinc-600">Đăng nhập để bình luận và quản trị nội dung.</p>
        </header>

        <form action={loginAction} className="space-y-3">
          <label className="block space-y-1">
            <span className="text-sm font-medium text-zinc-700">Email</span>
            <input
              name="email"
              type="email"
              required
              placeholder="admin@songhay.vn"
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
            />
          </label>

          <label className="block space-y-1">
            <span className="text-sm font-medium text-zinc-700">Mật khẩu</span>
            <input
              name="password"
              type="password"
              required
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
            />
          </label>

          <button type="submit" className="h-10 w-full rounded-md bg-rose-600 text-sm font-semibold text-white hover:bg-rose-700">
            Đăng nhập
          </button>
        </form>

        <p className="text-xs text-zinc-500">
          Tài khoản admin mặc định sau khi chạy seed: <span className="font-semibold">admin@songhay.vn / Admin@123456</span>
        </p>

        <Link href="/" className="inline-block text-sm font-semibold text-zinc-700 underline underline-offset-2 hover:text-rose-600">
          Quay về trang chủ
        </Link>
      </section>
    </main>
  )
}
