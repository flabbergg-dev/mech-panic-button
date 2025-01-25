"use server"

import { auth, clerkClient } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"

export async function getUserRole() {
  try {
    const { userId } = await auth()
    const clerk = await clerkClient()
    
    if (!userId) {
      return null
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    })

    if (user?.role) {
      // Ensure Clerk metadata is in sync
      const userData = await clerk.users.getUser(userId)
      if (userData.publicMetadata.role !== user.role) {
        await clerk.users.updateUser(userId, {
          publicMetadata: { role: user.role }
        })
      }
    }

    return user?.role || null
  } catch (error) {
    console.error('Error fetching user role:', error)
    return null
  }
}
