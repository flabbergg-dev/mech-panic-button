'use server'

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { ServiceStatus } from "@prisma/client"

export async function generateCompletionPinAction(requestId: string) {
  try {
    // Generate a random 6-digit PIN
    const pin = Math.floor(100000 + Math.random() * 900000).toString()
    
    // Store the completion code
    await prisma.serviceRequest.update({
      where: { id: requestId },
      data: {
        completionCode: pin,
        status: ServiceStatus.IN_COMPLETION
      }
    })

    revalidatePath('/dashboard')
    return { success: true }
  } catch (error) {
    console.error('Error generating completion PIN:', error)
    throw new Error('Failed to generate completion PIN')
  }
}
