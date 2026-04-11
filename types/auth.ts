import type { UserRole } from "@/generated/prisma/client"

export type SessionPayload = {
  userId: string
  role: UserRole
  exp: number
}
