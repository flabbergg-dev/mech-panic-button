'use server'

import { prisma } from "@/lib/prisma"

export async function getMechanicServiceOfferAction(mechanicId: string, requestId: string) {
  try {
    const serviceOffer = await prisma.serviceOffer.findFirst({
      where: {
        mechanicId,
        serviceRequestId: requestId,
      },
      include: {
        serviceRequest: true
      }
    })

    return {
      success: true as const,
      data: serviceOffer
    }
  } catch (error) {
    console.error("[GET_MECHANIC_SERVICE_OFFER_ACTION]", error)
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Failed to fetch service offer"
    }
  }
}
