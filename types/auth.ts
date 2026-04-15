import type { UserRole } from "@prisma/client"

export type SessionPayload = {
  userId: string
  role: UserRole
  exp: number
}
