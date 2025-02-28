'use server'

import { prisma } from "@/lib/prisma"
import { ServiceStatus } from "@prisma/client"
import { auth } from "@clerk/nextjs/server"

interface Location {
  latitude: number
  longitude: number
}

/**
 * Fetches the current location of a mechanic for an active service request
 * @param mechanicId The ID of the mechanic to fetch location for
 * @returns The mechanic's location coordinates or null if not found
 */
export async function getMechanicLocation(mechanicId: string): Promise<Location | null> {
  try {
    const { userId } = await auth()
    if (!userId) {
      throw new Error("Unauthorized")
    }

    const activeRequest = await prisma.serviceRequest.findFirst({
      where: {
        mechanicId: mechanicId,
        status: ServiceStatus.IN_ROUTE,
      },
      select: {
        id: true,
        status: true,
        mechanicLocation: true
      }
    })

    if (activeRequest?.mechanicLocation) {
      // Parse the JSON mechanicLocation if it's a string, or use it directly if it's already an object
      const mechanicLocationData = typeof activeRequest.mechanicLocation === 'string' 
        ? JSON.parse(activeRequest.mechanicLocation) 
        : activeRequest.mechanicLocation as any
          
      const location: Location = {
        latitude: mechanicLocationData.latitude,
        longitude: mechanicLocationData.longitude
      }
      
      return location
    }
    
    return null
  } catch (error) {
    console.error("Error fetching mechanic location:", error)
    throw new Error("Failed to fetch mechanic location")
  }
}

/**
 * Updates the mechanic's location for an active service request
 * @param mechanicId The ID of the mechanic
 * @param location The current location coordinates
 * @returns Success status
 */
export async function updateMechanicLocation(
  mechanicId: string, 
  location: Location
): Promise<{ success: boolean }> {
  try {
    const { userId } = await auth()
    if (!userId) {
      throw new Error("Unauthorized")
    }

    // Validate location input
    if (
      typeof location.latitude !== 'number' || 
      typeof location.longitude !== 'number' ||
      location.latitude < -90 || 
      location.latitude > 90 ||
      location.longitude < -180 || 
      location.longitude > 180
    ) {
      throw new Error("Invalid location coordinates")
    }

    await prisma.serviceRequest.updateMany({
      where: {
        mechanicId: mechanicId,
        status: ServiceStatus.IN_ROUTE,
      },
      data: {
        mechanicLocation: location as any,
      }
    })

    return { success: true }
  } catch (error) {
    console.error("Error updating mechanic location:", error)
    throw new Error("Failed to update mechanic location")
  }
}
