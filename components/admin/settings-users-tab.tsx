import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select } from "@/components/ui/select"
import { PendingSubmitButton } from "@/components/admin/pending-submit-button"
import { ROLE_LABELS_VI, ALL_EDITABLE_ROLES } from "@/lib/permissions"
import type { UserRow } from "@/app/admin/data-types"
import type { UserRole } from "@/generated/prisma/client"

const ROLE_BADGE_COLORS: Record<UserRole, string> = {
  ADMIN: "bg-red-100 text-red-700 border-red-200",
  USER: "bg-zinc-100 text-zinc-600 border-zinc-200",
  EDITOR_IN_CHIEF: "bg-violet-100 text-violet-700 border-violet-200",
  MANAGING_EDITOR: "bg-blue-100 text-blue-700 border-blue-200",
  TEAM_LEAD: "bg-sky-100 text-sky-700 border-sky-200",
  REPORTER_TRANSLATOR: "bg-emerald-100 text-emerald-700 border-emerald-200",
  CONTRIBUTOR: "bg-amber-100 text-amber-700 border-amber-200",
}

type SettingsUsersTabProps = {
  users: UserRow[]
  currentUserId: string
  updateUserRole: (formData: FormData) => Promise<void>
  deleteUser: (formData: FormData) => Promise<void>
}

export function SettingsUsersTab({
  users,
  currentUserId,
  updateUserRole,
  deleteUser,
}: SettingsUsersTabProps) {
  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="space-y-4 pt-6 p-0">
          <div className="px-4 pb-2">
            <p className="text-sm font-semibold">Danh sách người dùng</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Họ tên</th>
                  <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Email</th>
                  <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Vai trò hiện tại</th>
                  <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Ngày tạo</th>
                  <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {users.map((user) => {
                  const isSelf = user.id === currentUserId
                  const isProtected = user.role === "EDITOR_IN_CHIEF" || user.role === "ADMIN"
                  const canDelete = !isSelf && !isProtected

                  return (
                    <tr key={user.id} className="group hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{user.name}</span>
                          {isSelf && (
                            <Badge variant="secondary" className="text-[10px] h-4 px-1.5">
                              Bạn
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground font-mono text-xs">
                        {user.email}
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant="outline"
                          className={`text-xs ${ROLE_BADGE_COLORS[user.role]}`}
                        >
                          {ROLE_LABELS_VI[user.role]}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">
                        {new Date(user.createdAt).toLocaleDateString("vi-VN", {
                          year: "numeric",
                          month: "2-digit",
                          day: "2-digit",
                        })}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {/* Role change form */}
                          {!isSelf && !isProtected ? (
                            <form action={updateUserRole} className="flex items-center gap-1.5">
                              <input type="hidden" name="userId" value={user.id} />
                              <Select
                                name="newRole"
                                defaultValue={user.role}
                                className="h-7 text-xs py-0 pr-6 pl-2"
                              >
                                {ALL_EDITABLE_ROLES.map((role) => (
                                  <option key={role} value={role}>
                                    {ROLE_LABELS_VI[role]}
                                  </option>
                                ))}
                              </Select>
                              <PendingSubmitButton
                                type="submit"
                                pendingText="..."
                                className="h-7 px-2.5 text-xs"
                              >
                                Lưu
                              </PendingSubmitButton>
                            </form>
                          ) : (
                            <span className="text-muted-foreground text-xs italic">
                              {isSelf ? "Tài khoản của bạn" : "Không thể thay đổi"}
                            </span>
                          )}

                          {/* Delete form */}
                          {canDelete && (
                            <form action={deleteUser}>
                              <input type="hidden" name="userId" value={user.id} />
                              <PendingSubmitButton
                                type="submit"
                                pendingText="..."
                                className="h-7 px-2.5 text-xs bg-red-50 text-red-600 border-red-200 hover:bg-red-100 hover:text-red-700"
                                variant="outline"
                              >
                                Xóa
                              </PendingSubmitButton>
                            </form>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {users.length === 0 && (
              <p className="text-muted-foreground text-center py-8 text-sm">Chưa có người dùng nào.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
