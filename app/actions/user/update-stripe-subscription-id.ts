"use server"

import { prisma } from "@/lib/prisma"

export async function updateStripesubscriptionId(userId: string, stripesubscriptionId: string) {
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
