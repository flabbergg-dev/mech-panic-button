'use server'

import { prisma } from "@/lib/prisma"
import { ServiceStatus } from "@prisma/client"

export type MechanicLocation = {
  latitude: number
  longitude: number
} | null

export async function getMechanicLocationAction(serviceRequestId: string): Promise<MechanicLocation> {
  try {
    const serviceRequest = await prisma.serviceRequest.findUnique({
      where: {
        id: serviceRequestId,
        status: ServiceStatus.IN_ROUTE
      }
    })

    if (!serviceRequest?.mechanicLocation) {
      return null
    }

    return serviceRequest.mechanicLocation as MechanicLocation
  } catch (error) {
    console.error('Error fetching mechanic location:', error)
    return null
  }
}
