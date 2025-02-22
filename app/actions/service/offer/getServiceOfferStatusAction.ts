'use server'

import { prisma } from "@/lib/prisma"
import { OfferStatus } from "@prisma/client"

export async function getServiceOfferStatusAction(serviceRequestId: string) {
  try {
    const offer = await prisma.serviceOffer.findFirst({
      where: {
        serviceRequestId: serviceRequestId,
        status: OfferStatus.ACCEPTED
      }
    })

    return {
      success: true,
      isAccepted: !!offer
    }
  } catch (error) {
    console.error("Error in getServiceOfferStatusAction:", error)
    return {
      success: false,
      isAccepted: false,
      error: error instanceof Error ? error.message : 'An unknown error occurred'
    }
  }
}
