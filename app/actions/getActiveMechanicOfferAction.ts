'use server'

import { prisma } from "@/lib/prisma"

export async function getActiveMechanicOfferAction(userId: string | undefined) {
  try {
    if (!userId) return {
      success: false as const,
      error: "User not found"
    }

    const mechanic = await prisma.mechanic.findUnique({
      where: { userId },
      select: { id: true }
    })

    if (!mechanic) {
      return {
        success: false as const,
        error: "Mechanic not found"
      }
    }
    const activeOffer = await prisma.serviceOffer.findFirst({
      where: {
        mechanicId: mechanic.id,
        status: {
          in: ['PENDING', 'ACCEPTED']
        },
        expiresAt: {
          gt: new Date()
        },
      },
      select: {
        serviceRequestId: true
      },
    })

    if (!activeOffer) {
      return {
        success: false as const,
        error: "No active offer found"
      }
    }    
    return {
      success: true as const,
      data: activeOffer
    }
  } catch (error) {
    console.error("[GET_ACTIVE_MECHANIC_OFFER_ACTION]", error)
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Failed to fetch active offer"
    }
  }
}
