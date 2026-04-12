"use server"

import { revalidatePath } from "next/cache"
import { requireCmsUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function markNotificationAsRead(notificationId: string) {
  const currentUser = await requireCmsUser()
  
  await prisma.notification.update({
    where: { 
      id: notificationId,
      userId: currentUser.id 
    },
    data: { isRead: true },
  })
  
  revalidatePath("/admin")
}

export async function markAllNotificationsAsRead() {
  const currentUser = await requireCmsUser()
  
  await prisma.notification.updateMany({
    where: { 
      userId: currentUser.id,
      isRead: false 
    },
    data: { isRead: true },
  })
  
  revalidatePath("/admin")
}
