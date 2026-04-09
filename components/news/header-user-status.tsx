"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { SearchIconPopup } from "./search-icon-popup"
import { MobileNav } from "./mobile-nav"
import { getNavCategories } from "@/lib/queries"

type UserStatus = {
  id: string
  name: string
}

type HeaderUserStatusProps = {
  navCategories: Awaited<ReturnType<typeof getNavCategories>>
  defaultSearchQuery?: string
}

export function HeaderUserStatus({ navCategories, defaultSearchQuery }: HeaderUserStatusProps) {
  const [user, setUser] = useState<UserStatus | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch("/api/me")
        const data = await res.json()
        setUser(data.user)
      } catch (err) {
        console.error("Failed to fetch user status", err)
      } finally {
        setIsLoading(false)
      }
    }
    fetchUser()
  }, [])

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" })
      window.location.reload()
    } catch (err) {
      console.error("Logout failed", err)
    }
  }

  return (
    <div className="mt-1 flex items-center gap-3">
      <div className="hidden text-sm text-zinc-600 md:block">
        <ClientDate />
      </div>
      
      {!isLoading && user ? (
        <>
          <Link
            href="/admin"
            className="rounded-md border border-white/30 bg-white/10 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-white/20 md:border-zinc-300 md:bg-white md:text-zinc-700 md:hover:bg-zinc-100"
          >
            CMS
          </Link>
          <span className="hidden text-sm font-semibold text-white md:inline md:text-zinc-700">
            {user.name}
          </span>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-md border border-white/30 bg-white/10 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-white/20 md:border-zinc-300 md:bg-white md:text-zinc-700 md:hover:bg-zinc-100"
          >
            Đăng xuất
          </button>
        </>
      ) : null}

      <SearchIconPopup defaultValue={defaultSearchQuery} />
      <MobileNav navCategories={navCategories} defaultSearchQuery={defaultSearchQuery} />
    </div>
  )
}

function ClientDate() {
  const [dateStr, setDateStr] = useState("")

  useEffect(() => {
    const days = ["Chủ nhật", "Thứ hai", "Thứ ba", "Thứ tư", "Thứ năm", "Thứ sáu", "Thứ bảy"]
    const now = new Date()
    const dayName = days[now.getDay()]
    const day = now.getDate()
    const month = now.getMonth() + 1
    const year = now.getFullYear()
    setDateStr(`${dayName}, ngày ${day} tháng ${month} năm ${year}`)
  }, [])

  if (!dateStr) return null // Avoid hydration mismatch

  return dateStr
}
