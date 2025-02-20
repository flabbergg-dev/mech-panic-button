"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@clerk/nextjs/server"
export async function getStripeCustomerId() {
  const { userId } = await auth()
  
  if (!userId) {
    return null
  }

  const stripeCustomerId = await prisma.user.findUnique({
    where: { id: userId },
    select: { stripeCustomerId: true }
  })

  return stripeCustomerId
}
