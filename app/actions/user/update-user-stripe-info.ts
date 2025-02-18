"use server"

import { prisma } from "@/lib/prisma"

export async function updateUserStripeInfo(userId: string, stripesubscriptionId: string, stripeSubscriptionStatus: string) {
  if (!userId) {
    return {
      success: false,
      error: "Missing required data",
    }
  }

  try {
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        stripeSubscriptionId: stripesubscriptionId,
        stripeSubscriptionStatus: stripeSubscriptionStatus as 'ACTIVE' | 'CANCELED' | 'UNPAID' | 'PAST_DUE',
      },
    })

    return {
      success: true,
      data: user,
    }
  } catch (error) {
    console.error("Error updating stripe subscription id:", error instanceof Error ? error.message : "Unknown error")
    return {
      success: false,
      error: "Failed to update stripe subscription id",
    }
  }
}
