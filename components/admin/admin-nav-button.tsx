"use client"

import type { MouseEvent } from "react"
import { Suspense } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import {
  FolderKanban,
  KeyRound,
  LayoutDashboard,
  LibraryBig,
  MessageSquareMore,
  Newspaper,
  PenSquare,
  ShieldCheck,
  Trash2,
  UserSquare2,
  Users,
} from "lucide-react"

import type { NavIconName, NavLeaf } from "@/app/admin/page-helpers"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

const WRITE_DIRTY_STORAGE_KEY = "admin-write-dirty"

const navIcons: Record<NavIconName, typeof LayoutDashboard> = {
  layoutDashboard: LayoutDashboard,
  penSquare: PenSquare,
  libraryBig: LibraryBig,
  userSquare2: UserSquare2,
  newspaper: Newspaper,
  trash2: Trash2,
  keyRound: KeyRound,
  messageSquareMore: MessageSquareMore,
  folderKanban: FolderKanban,
  shieldCheck: ShieldCheck,
  users: Users,
}

type AdminNavButtonProps = {
  tab: NavLeaf
  count?: number
}

export function AdminNavButtonInner({ tab, count }: AdminNavButtonProps) {
  const searchParams = useSearchParams()
  const activeTab = searchParams.get("tab") || "overview"
  const TabIcon = navIcons[tab.iconName]
  const isActive = activeTab === tab.key

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          asChild
          variant="ghost"
          className={`h-10 w-full justify-start rounded-xl border px-3.5 ${
            isActive
              ? "border-zinc-200 bg-zinc-100 text-zinc-900 hover:bg-zinc-100 hover:text-zinc-900"
              : "border-transparent text-zinc-600 hover:border-zinc-200 hover:bg-zinc-50 hover:text-zinc-900"
          }`}
        >
          <Link
            href={`/admin?tab=${tab.key}`}
            className="flex w-full items-center gap-2"
          >
            <span className="flex min-w-0 flex-1 items-center gap-2.5">
              <TabIcon
                className={`size-4 ${
                  isActive ? "text-zinc-900" : "text-zinc-500"
                }`}
              />
              <span className="truncate">{tab.label}</span>
            </span>
            {typeof count === "number" ? (
              <Badge
                variant="secondary"
                className={`ml-auto h-5 min-w-6 justify-center px-1.5 text-[11px] font-semibold tabular-nums ${
                  isActive
                    ? "bg-zinc-900 text-white"
                    : "bg-zinc-100 text-zinc-600"
                }`}
              >
                {count.toLocaleString("vi-VN")}
              </Badge>
            ) : null}
          </Link>
        </Button>
      </TooltipTrigger>
      <TooltipContent side="right" className="max-w-72">
        {tab.description}
      </TooltipContent>
    </Tooltip>
  )
}

export function AdminNavButton({ tab, count }: AdminNavButtonProps) {
  return (
    <Suspense fallback={
      <div className="h-10 w-full rounded-xl bg-zinc-100 animate-pulse" />
    }>
      <AdminNavButtonInner tab={tab} count={count} />
    </Suspense>
  )
}
