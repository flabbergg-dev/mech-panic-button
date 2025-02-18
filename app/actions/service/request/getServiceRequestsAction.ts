'use server'

import { prisma } from "@/lib/prisma"
import { ServiceStatus } from "@prisma/client"

export async function getServiceRequestsAction() {
  try {
    let serviceRequests = await prisma.serviceRequest.findMany({
      where: {
          status: ServiceStatus.REQUESTED
      },
      include: {
        client: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
    return {
      serviceRequests,
    }
  } catch (error) {
    console.error("Error in getServiceRequestsAction:", error)
    return {
      error: error instanceof Error ? error.message : "Failed to fetch service requests",
    }
  }
}