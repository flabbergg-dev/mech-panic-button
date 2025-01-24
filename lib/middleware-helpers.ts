import { prisma } from "@/lib/prisma"

export async function getUserRoleForMiddleware(userId: string | null) {
  if (!userId) return null
  
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    })
    return user?.role || null
  } catch (error) {
    console.error('Error fetching user role in middleware:', error)
    return null
  }
}
