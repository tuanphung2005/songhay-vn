import Link from "next/link"

import { clearSessionCookie, getCurrentUser } from "@/lib/auth"
import { getNavCategories } from "@/lib/queries"
import { MobileNav } from "./mobile-nav"
import { NewsSearchForm } from "./search"

type SiteHeaderProps = {
  defaultSearchQuery?: string
}

export async function SiteHeader({ defaultSearchQuery }: SiteHeaderProps = {}) {
  const [user, navCategories] = await Promise.all([getCurrentUser(), getNavCategories()])

  async function logoutAction() {
    "use server"
    await clearSessionCookie()
  }

  return (
    <header className="border-b border-red-800 bg-red-700 md:border-zinc-200 md:bg-zinc-50">
      <div className="mx-auto flex w-full max-w-7xl items-start justify-between px-4 py-5 md:px-6 md:py-6">
        <Link href="/" className="group block">
          <div className="flex items-center gap-2 md:gap-3">
            <span className="inline-flex h-14 w-14 items-center justify-center bg-white text-4xl font-black text-red-700 transition group-hover:bg-zinc-100 md:bg-red-700 md:text-white md:group-hover:bg-red-800 md:h-16 md:w-16">
              S
            </span>
            <div>
              <p className="text-3xl font-black uppercase leading-none tracking-tight text-white md:text-red-700 md:text-5xl">Sống Hay</p>
              <p className="mt-1 text-sm font-extrabold uppercase tracking-wide text-white/90 md:text-zinc-900 md:text-xl">Kho Tàng Điều Hay</p>
            </div>
          </div>
        </Link>

        <div className="mt-1 flex items-center gap-2">
          {user ? (
            <>
              <Link
                href="/admin"
                className="rounded-md border border-white/30 bg-white/10 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-white/20 md:border-zinc-300 md:bg-white md:text-zinc-700 md:hover:bg-zinc-100"
              >
                CMS
              </Link>
              <span className="hidden text-sm font-semibold text-white md:inline md:text-zinc-700">{user.name}</span>
              <form action={logoutAction}>
                <button
                  type="submit"
                  className="rounded-md border border-white/30 bg-white/10 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-white/20 md:border-zinc-300 md:bg-white md:text-zinc-700 md:hover:bg-zinc-100"
                >
                  Đăng xuất
                </button>
              </form>
            </>
          ) : null}
          <NewsSearchForm
            className="hidden w-72 md:block"
            defaultValue={defaultSearchQuery}
            placeholder="Tìm bài viết..."
            submitAriaLabel="Tìm bài viết"
            enableSuggestions
            suggestionsLimit={6}
            inputClassName="h-10 border-zinc-300 bg-white pl-10 pr-11 text-sm"
            buttonClassName="border-zinc-200 bg-zinc-50 text-zinc-700 hover:bg-zinc-100"
          />
          <MobileNav navCategories={navCategories} defaultSearchQuery={defaultSearchQuery} />
        </div>
      </div>

      <nav className="hidden bg-red-700 md:block">
        <ul className="mx-auto flex w-full max-w-7xl flex-wrap items-center gap-x-8 gap-y-4 px-4 py-3 text-xl font-bold text-white md:px-6">
          {navCategories.map((item) => (
            <li key={item.slug} className="group relative">
              <Link
                href={`/${item.slug}`}
                className="flex items-center gap-1 border-b-2 border-transparent pb-1 leading-none transition hover:border-white/90 hover:text-white/90"
              >
                {item.name}
              </Link>
              {item.children && item.children.length > 0 ? (
                <ul className="invisible absolute left-0 top-full z-50 mt-2 min-w-[200px] origin-top-left flex-col gap-1 rounded-md bg-white p-2 text-sm font-medium text-zinc-800 opacity-0 shadow-lg ring-1 ring-black/5 transition-all duration-200 group-hover:visible group-hover:opacity-100">
                  {item.children.map((child) => (
                    <li key={child.slug}>
                      <Link
                        href={`/${child.slug}`}
                        className="block rounded px-3 py-2 transition hover:bg-zinc-100 hover:text-red-700"
                      >
                        {child.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : null}
            </li>
          ))}
        </ul>
      </nav>
    </header>
  )
}
