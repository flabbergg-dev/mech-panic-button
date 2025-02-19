"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@clerk/nextjs/server"
export async function getStripeCustomerId(passedUserId?: string) {
  const { userId: authUserId } = await auth()
  const userId = passedUserId || authUserId
  
  if (!userId) {
    return null
  }

  const stripeCustomerId = await prisma.user.findUnique({
    where: { id: userId },
    select: { stripeCustomerId: true }
  })

  return stripeCustomerId
}
