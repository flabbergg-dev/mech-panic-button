'use server'

import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { ServiceStatus } from "@prisma/client"

export async function getServiceRequestsForClient(userId: string) {
  console.log('Fetching requests for user:', userId)
  
  const requests = await prisma.serviceRequest.findMany({
    where: {
      clientId: userId,
      NOT: [
        {status: ServiceStatus.COMPLETED}
      ]
      
    },
    orderBy: {
      createdAt: 'desc'
    }
  })
  console.log('Found requests:', requests)
  return requests
}

export async function getServiceRequestAction(requestId: string) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      throw new Error("Unauthorized")
    }

    if (!requestId) { 
      throw new Error("Invalid request ID")
    }
    
    const serviceRequest = await prisma.serviceRequest.findUnique({
      where: {
        id: requestId,
      },
      include: {
        client: true,
        offers: {
          include: {
            mechanic: {
              include: {
                user: true
              }
            }
          }
        }
      }
    })

    if (!serviceRequest) {
      throw new Error("Service request not found")
    }

    return {
      success: true as const,
      data: serviceRequest
    }
  } catch (error) {
    console.error("[GET_SERVICE_REQUEST_ACTION]", error)
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Failed to fetch service request"
    }
  }
}