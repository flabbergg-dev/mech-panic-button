'use server'

import { prisma } from "@/lib/prisma"
import { ServiceStatus, OfferStatus } from "@prisma/client"

export async function updateServiceRequestByIdAction(serviceRequestId: string) {
  
      await prisma.serviceRequest.update({
        where: { id: serviceRequestId },
        data: {
          status: ServiceStatus.PAYMENT_AUTHORIZED,
        }
      }).then((result) => {
        return { success: true, message: "Service request updated successfully" }
      }).catch((error) => {
        return {
          error: error instanceof Error ? error.message : "Failed to update service request",
        }
      })
     


  }