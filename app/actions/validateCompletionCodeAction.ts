'use server'

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { ServiceStatus } from "@prisma/client"

export async function validateCompletionCodeAction(requestId: string, enteredCode: string) {
  try {
    // Get the service request
    const request = await prisma.serviceRequest.findUnique({
      where: { id: requestId },
      select: {
        completionCode: true,
        status: true,
        mechanicId: true,
        totalAmount: true
      }
    })

    if (!request) {
      throw new Error('Service request not found: #ERR08')
    }

    if (request.status !== ServiceStatus.IN_COMPLETION) {
      throw new Error('Service request is not in completion state')
    }

    // Validate the completion code
    if (request.completionCode !== enteredCode) {
      throw new Error('Invalid completion code')
    }

    // Update service status to completed
    await prisma.serviceRequest.update({
      where: { id: requestId },
      data: {
        status: ServiceStatus.COMPLETED,
        completionTime: new Date()
      }
    })

    // TODO: Implement Stripe payment processing here
    // This would involve creating a payment intent and transferring funds to the mechanic
    
    revalidatePath('/dashboard')
    return { success: true }
  } catch (error) {
    console.error('Error validating completion code:', error)
    throw error
  }
}
