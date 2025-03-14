'use server'

import { prisma } from "@/lib/prisma"
import { ServiceStatus } from "@prisma/client"

export async function verifyCompletionCodeAction(serviceRequestId: string, code: string) {
  try {
    
    const serviceRequest = await prisma.serviceRequest.findUnique({
      where: {
        id: serviceRequestId,
        status: ServiceStatus.IN_COMPLETION
      },
      select: {
        completionCode: true
      }
    })

    if (!serviceRequest) {
      return { success: false, error: "Service request not found: ERR09" }
    }     

    if (serviceRequest.completionCode !== code) {
      return { success: false, error: "Invalid code" }
    }

    // Update both service request and offer in a transaction
    const updatedRequest = await prisma.$transaction(async (tx) => {
      // Update the service request
      const request = await tx.serviceRequest.update({
        where: { id: serviceRequestId },
        data: {
          completionTime: new Date(),
          status: ServiceStatus.COMPLETED
        },
        include: {
          offers: {
            where: {
              status: 'ACCEPTED'
            }
          }
        }
      })

      // Update the accepted offer
      if (request.offers[0]) {
        await tx.serviceOffer.update({
          where: { id: request.offers[0].id },
          data: {
            status: 'EXPIRED'
          }
        })
      }

      return request
    })

    return { success: true, request: updatedRequest }
  } catch (error) {
    console.error('Error verifying completion code:', error)
    return { success: false, error: "Failed to verify code" }
  }
}
