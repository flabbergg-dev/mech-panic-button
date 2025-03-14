'use server'

import { prisma } from "@/lib/prisma"
import { ServiceStatus } from "@prisma/client"

export async function verifyArrivalCodeAction(serviceRequestId: string, code: string) {
  try {
    
    const serviceRequest = await prisma.serviceRequest.findUnique({
      where: {
        id: serviceRequestId,
        status: ServiceStatus.IN_PROGRESS
      },
      select: {
        arrivalCode: true
      }
    })

    if (!serviceRequest) {
      return { success: false, error: "Service request not found: ERR09" }
    }     

    if (serviceRequest.arrivalCode !== code) {
      return { success: false, error: "Invalid code" }
    }

    // Update the service request with start time and change status
    const updatedRequest = await prisma.serviceRequest.update({
      where: { id: serviceRequestId },
      data: {
        startTime: new Date(),
        status: ServiceStatus.SERVICING
      }
    })

    return { success: true, request: updatedRequest }
  } catch (error) {
    console.error('Error verifying arrival code:', error)
    return { success: false, error: "Failed to verify code" }
  }
}
