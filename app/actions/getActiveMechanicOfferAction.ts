'use server'

import { prisma } from "@/lib/prisma"
import { OfferStatus } from "@prisma/client"

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

    // First check if any offers exist for this mechanic
    const activeOffer = await prisma.serviceOffer.findMany({
      where: {
        mechanicId: mechanic.id,
        OR: [
          { status: OfferStatus.ACCEPTED },
          { status: OfferStatus.PENDING }
        ]
      },
      select: {
        serviceRequestId: true,
      }
    })


    if (activeOffer === null) {
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
