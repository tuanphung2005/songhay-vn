import type { AdminTab } from "@/app/admin/data-types"
import { prisma } from "@/lib/prisma"
import {
  ALL_EDITABLE_ROLES,
  hydratePermissionsFromDb,
  type PermissionAction,
} from "@/lib/permissions"
import type { UserRole } from "@prisma/client"

export type PermissionsMatrixRow = {
  role: UserRole
  actions: Set<PermissionAction>
}

/**
 * Loads RolePermission rows from DB, hydrates the runtime in-memory map,
 * and returns the matrix for the permissions tab UI.
 * Always fetches (used on every settings-permissions page load).
 */
export async function getRolePermissionsData(activeTab: AdminTab): Promise<PermissionsMatrixRow[]> {
  if (activeTab !== "settings-permissions") {
    return []
  }

  const rows = await prisma.rolePermission.findMany({
    where: { role: { in: ALL_EDITABLE_ROLES } },
    select: { role: true, action: true },
  })

  // Hydrate the runtime map so that the rest of the request uses DB values
  hydratePermissionsFromDb(rows)

  // Build the matrix for the UI
  const matrix = ALL_EDITABLE_ROLES.map((role) => {
    const actions = new Set<PermissionAction>()
    for (const row of rows) {
      if (row.role === role) {
        actions.add(row.action as PermissionAction)
      }
    }
    return { role, actions }
  })

  return matrix
}
