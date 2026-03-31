"use client"

import type { MouseEvent } from "react"
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

import type { AdminTab } from "@/app/admin/data"
import type { NavIconName, NavLeaf } from "@/app/admin/page-helpers"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

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
  activeTab: AdminTab
  count?: number
}

export function AdminNavButton({ tab, activeTab, count }: AdminNavButtonProps) {
  const TabIcon = navIcons[tab.iconName]

  function handleNavigationAttempt(event: MouseEvent<HTMLAnchorElement>) {
    if (activeTab !== "write" || tab.key === "write") {
      return
    }

    const isDirty = typeof window !== "undefined" && window.sessionStorage.getItem(WRITE_DIRTY_STORAGE_KEY) === "1"
    if (!isDirty) {
      return
    }

    const confirmed = window.confirm("Bạn đang có nội dung chưa lưu trong trình soạn thảo. Vẫn chuyển tab?")
    if (!confirmed) {
      event.preventDefault()
      return
    }

    window.sessionStorage.setItem(WRITE_DIRTY_STORAGE_KEY, "0")
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button asChild className="h-9 w-full justify-start px-2.5" variant={activeTab === tab.key ? "secondary" : "ghost"}>
          <a href={`/admin?tab=${tab.key}`} onClick={handleNavigationAttempt} className="flex w-full items-center gap-2">
            <span className="flex min-w-0 flex-1 items-center gap-2.5">
              <TabIcon className="size-4" />
              <span className="truncate">{tab.label}</span>
            </span>
            {typeof count === "number" ? (
              <Badge variant="secondary" className="ml-auto h-5 min-w-6 justify-center px-1.5 text-[11px] font-semibold tabular-nums">
                {count.toLocaleString("vi-VN")}
              </Badge>
            ) : null}
          </a>
        </Button>
      </TooltipTrigger>
      <TooltipContent side="right" className="max-w-72">
        {tab.description}
      </TooltipContent>
    </Tooltip>
  )
}
