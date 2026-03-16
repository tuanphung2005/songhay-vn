import Link from "next/link"
import { ArrowRight, Search } from "lucide-react"

import { clearSessionCookie, getCurrentUser } from "@/lib/auth"
import { getNavCategories } from "@/lib/queries"

export async function SiteHeader() {
  const [user, navCategories] = await Promise.all([getCurrentUser(), getNavCategories()])

  async function logoutAction() {
    "use server"
    await clearSessionCookie()
  }

  return (
    <header className="border-b border-zinc-200 bg-zinc-50">
      <div className="mx-auto flex w-full max-w-7xl items-start justify-between px-4 py-5 md:px-6 md:py-6">
        <Link href="/" className="group block">
          <div className="flex items-center gap-2 md:gap-3">
            <span className="inline-flex h-14 w-14 items-center justify-center bg-red-700 text-4xl font-black text-white transition group-hover:bg-red-800 md:h-16 md:w-16">
              S
            </span>
            <div>
              <p className="text-3xl font-black uppercase leading-none tracking-tight text-red-700 md:text-5xl">Sống Hay</p>
              <p className="mt-1 text-sm font-extrabold uppercase tracking-wide text-zinc-900 md:text-xl">Kho Tàng Điều Hay</p>
            </div>
          </div>
        </Link>

        <div className="mt-1 flex items-center gap-2">
          {user?.role === "ADMIN" ? (
            <>
              <Link
                href="/admin"
                className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-100"
              >
                CMS
              </Link>
              <span className="hidden text-sm font-semibold text-zinc-700 md:inline">{user.name}</span>
              <form action={logoutAction}>
                <button
                  type="submit"
                  className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-100"
                >
                  Đăng xuất
                </button>
              </form>
            </>
          ) : null}
          <button
            type="button"
            aria-label="Tìm kiếm"
            className="rounded-full border border-zinc-300 bg-white p-2 text-zinc-700 transition hover:bg-zinc-100"
          >
            <Search className="size-5" />
          </button>
        </div>
      </div>

      <nav className="bg-red-700">
        <ul className="mx-auto flex w-full max-w-7xl min-w-max items-center gap-8 overflow-x-auto px-4 py-3 text-xl font-bold text-white md:px-6">
          {navCategories.map((item) => (
            <li key={item.slug}>
              <Link
                href={`/${item.slug}`}
                className="border-b-2 border-transparent pb-1 leading-none transition hover:border-white/90 hover:text-white/90"
              >
                {item.name}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  )
}
