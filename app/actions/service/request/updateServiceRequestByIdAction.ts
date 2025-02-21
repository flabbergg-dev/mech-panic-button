'use server'

import { prisma } from "@/lib/prisma"
import { ServiceStatus, OfferStatus } from "@prisma/client"

export async function updateServiceRequestByIdAction(serviceRequestId: string) {
  try {
    await prisma.$transaction([
      // Update the offer status
      prisma.serviceOffer.update({
        where: { id: serviceRequestId },
        data: { status: OfferStatus.ACCEPTED }
      }),
      // Update the service request
      prisma.serviceRequest.update({
        where: { id: serviceRequestId },
        data: {
          status: ServiceStatus.PAYMENT_AUTHORIZED,
          // mechanicId: latestOffer.mechanicId
        }
      }),
      // Remove other offers
      prisma.serviceOffer.deleteMany({
        where: {
          serviceRequestId: serviceRequestId,
          // id: { not: latestOffer.id },
          status: OfferStatus.PENDING
        }
      })
    ])

    return { success: true, message: "Service request updated successfully" }
  } catch (error) {
    console.error("Error in getServiceRequestsAction:", error)
    return {
      error: error instanceof Error ? error.message : "Failed to fetch service requests",
    }
  }
}