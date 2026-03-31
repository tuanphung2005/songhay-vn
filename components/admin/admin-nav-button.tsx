import Link from "next/link"

import type { AdminTab } from "@/app/admin/data"
import type { NavLeaf } from "@/app/admin/page-helpers"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

type AdminNavButtonProps = {
  tab: NavLeaf
  activeTab: AdminTab
  count?: number
}

export function AdminNavButton({ tab, activeTab, count }: AdminNavButtonProps) {
  const TabIcon = tab.icon

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button asChild className="h-9 w-full justify-start px-2.5" variant={activeTab === tab.key ? "secondary" : "ghost"}>
          <Link href={`/admin?tab=${tab.key}`} className="flex w-full items-center gap-2">
            <span className="flex min-w-0 flex-1 items-center gap-2.5">
              <TabIcon className="size-4" />
              <span className="truncate">{tab.label}</span>
            </span>
            {typeof count === "number" ? (
              <Badge variant="secondary" className="ml-auto h-5 min-w-6 justify-center px-1.5 text-[11px] font-semibold tabular-nums">
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
