"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@clerk/nextjs/server"
export async function getStripeConnectId() {
  const { userId } = await auth()
  
  if (!userId) {
    return null
  }

  const stripeConnectId = await prisma.user.findUnique({
    where: { id: userId },
    select: { stripeConnectId: true }
  })

  return stripeConnectId
}
