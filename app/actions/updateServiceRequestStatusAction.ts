"use server"

import { prisma } from "@/lib/prisma"
import { generatePinCode } from "@/lib/utils"
import { ServiceStatus } from "@prisma/client"

export async function updateServiceRequestStatusAction(
  requestId: string,
  status: string,
  estimatedTime?: string
) {
  try {
    // Generate completion code if needed
    const completionCode = status === 'IN_COMPLETION' 
      ? String(Math.floor(Math.random() * 1000000).toString().padStart(6, '0'))
      : undefined;
      
    const updatedRequest = await prisma.serviceRequest.update({
      where: {
        id: requestId,
      },
      data: {
        status: status as ServiceStatus,
        ...(estimatedTime && {
          completionTime: new Date(estimatedTime)
        }),
        ...(status === 'IN_PROGRESS' && {
          startTime: new Date(),
          arrivalCode: String(Math.floor(Math.random() * 1000000).toString().padStart(6, '0'))
        }),
        ...(status === 'IN_COMPLETION' && {
          completionCode
        })
      },
      select: {
        arrivalCode: true,
        completionCode: true
      }
    })

    return { success: true, data: updatedRequest }
  } catch (error) {
    console.error('Failed to update service request status:', error)
    return { 
      success: false, 
      error: 'Failed to update service request status' 
    }
  }
}
