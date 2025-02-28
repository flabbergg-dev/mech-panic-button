'use server'

import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { ServiceStatus } from "@prisma/client"

export async function getServiceRequestsForClient(userId: string) {
  console.log('Fetching requests for user:', userId)
  
  try {
    const requests = await prisma.serviceRequest.findMany({
      where: {
        clientId: userId,
        // Include all requests, including completed ones
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
    console.log(`Found ${requests.length} requests for user ${userId}:`, 
      requests.map(r => ({ id: r.id, status: r.status }))
    )
    return requests
  } catch (error) {
    console.error('Error fetching service requests for client:', error)
    return []
  }
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
      throw new Error("Service request not found: ERR06")
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

export async function getServiceRequestByMechanicIdAction(userId: string) {
  try {
    if (!userId) {
      throw new Error("Unauthorized")
    }

    const mechanic = await prisma.mechanic.findUnique({
      where: {
        userId
      }
    })

    const serviceRequest = await prisma.serviceRequest.findFirst({
      where: {
        mechanicId: mechanic?.id,
        NOT: [
          {status: ServiceStatus.COMPLETED}
        ]
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
      throw new Error("Service request not found: ERR06")
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