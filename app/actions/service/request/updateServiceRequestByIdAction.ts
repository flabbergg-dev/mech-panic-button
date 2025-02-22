'use server'

import { prisma } from "@/lib/prisma"
import { ServiceStatus, OfferStatus } from "@prisma/client"

export async function updateServiceRequestByIdAction(serviceRequestId: string) {
  try {
      await prisma.serviceRequest.update({
        where: { id: serviceRequestId },
        data: {
          status: ServiceStatus.PAYMENT_AUTHORIZED,
        }
      })
      return { success: true, message: "Service request updated successfully" }}
      catch(error) {
        return { success: false, error: error instanceof Error ? error.message : "Failed to update service request" }
      }
  }