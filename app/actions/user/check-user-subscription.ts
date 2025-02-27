"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@clerk/nextjs/server"

export async function checkUserSubscription() {
  const { userId } = await auth()
  
  if (!userId) {
    return null
  }

  const subscription = await prisma.user.findUnique({
    where: { id: userId },
    select: { stripeSubscriptionId: true, stripeSubscriptionStatus: true, stripeSubscriptionPlan: true, stripeSubEndingDate: true },
    
  })

  return subscription
}
