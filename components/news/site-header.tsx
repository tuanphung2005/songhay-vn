import Link from "next/link"
import { Search } from "lucide-react"

import { NAV_CATEGORIES } from "@/lib/categories"

export function SiteHeader() {
  return (
    <header className="border-b border-zinc-200 bg-white">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-5 md:px-6">
        <Link href="/" className="text-3xl font-black tracking-tight text-rose-600">
          Songhay.vn
        </Link>
        <button
          type="button"
          aria-label="Tìm kiếm"
          className="rounded-full border border-zinc-200 p-2 text-zinc-700 transition hover:bg-zinc-100"
        >
          <Search className="size-5" />
        </button>
      </div>

      <nav className="mx-auto w-full max-w-7xl overflow-x-auto px-4 pb-4 md:px-6">
        <ul className="flex min-w-max items-center gap-6 text-sm font-semibold text-zinc-800">
          {NAV_CATEGORIES.map((item) => (
            <li key={item.slug}>
              <Link
                href={`/${item.slug}`}
                className="border-b-2 border-transparent pb-1 transition hover:border-rose-600 hover:text-rose-600"
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
