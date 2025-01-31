'use server'

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function cancelServiceRequest(id: string) {
  if (!id) {
    throw new Error('Request ID is required')
  }

  try {
    // Use a transaction to delete both ServiceOffers and ServiceRequest
    const result = await prisma.$transaction(async (tx) => {
      // First delete all related ServiceOffers
      await tx.serviceOffer.deleteMany({
        where: {
          serviceRequestId: id
        }
      })

      // Then delete the ServiceRequest
      const deletedServiceRequest = await tx.serviceRequest.delete({
        where: {
          id
        },
        include: {
          offers: true // Include this to verify deletion
        }
      })

      return deletedServiceRequest
    })

    revalidatePath('/dashboard')
    return { success: true, data: result }
  } catch (error) {
    console.error('Error canceling service request:', error)
    throw new Error('Failed to cancel service request')
  }
}
