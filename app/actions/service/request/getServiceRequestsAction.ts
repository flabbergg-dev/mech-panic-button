'use server'

import { prisma } from "@/lib/prisma"
import { ServiceStatus } from "@prisma/client"
import { calculateDistance } from "@/lib/location"
import { auth } from "@clerk/nextjs/server"

interface Location {
  latitude: number;
  longitude: number;
}

export async function getServiceRequestsAction() {
  try {
    
    // Get the current mechanic's location from their profile
    const { userId } = await auth();
    if (!userId) {
      throw new Error("No authenticated user found");
    }

    const mechanic = await prisma.mechanic.findUnique({
      where: { userId },
      select: { 
        location: true,
        id: true
      }
    });


    if (!mechanic) {
      return {
        serviceRequests: [],
        error: "Mechanic not found"
      };
    }

    if (!mechanic.location || typeof mechanic.location !== 'object') {
      return {
        serviceRequests: [],
        error: "Mechanic location not set"
      };
    }

    const mechanicLocation = mechanic.location as unknown as Location;
    if (!mechanicLocation || 
        typeof mechanicLocation.latitude !== 'number' || 
        typeof mechanicLocation.longitude !== 'number' ||
        Number.isNaN(mechanicLocation.latitude) || 
        Number.isNaN(mechanicLocation.longitude)) {
      return {
        serviceRequests: [],
        error: "Invalid mechanic location coordinates"
      };
    }

    // Get all service requests with status REQUESTED
    const serviceRequests = await prisma.serviceRequest.findMany({
      where: {
        status: ServiceStatus.REQUESTED,
        location: {
        }

      },
      include: {
        client: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            phoneNumber: true
          }
        },
        // vehicle: {
        //   select: {
        //     make: true,
        //     model: true,
        //     year: true
        //   }
        // }
      }
    });

    // Filter requests by distance
    const nearbyRequests = serviceRequests.filter(request => {
      if (!request.location || typeof request.location !== 'object') {
        return false;
      }

      const requestLocation = request.location as unknown as Location;
      if (!requestLocation || 
          typeof requestLocation.latitude !== 'number' || 
          typeof requestLocation.longitude !== 'number' ||
          Number.isNaN(requestLocation.latitude) || 
          Number.isNaN(requestLocation.longitude)) {
        return false;
      }

      const distance = calculateDistance(
        mechanicLocation,
        requestLocation
      );

      const isNearby = distance <= 50; // 50 mile radius
      return isNearby;
    });

    return {
      serviceRequests: nearbyRequests,
      error: null
    };
  } catch (error) {
    console.error("getServiceRequestsAction: Error fetching service requests:", error);
    return {
      serviceRequests: [],
      error: error instanceof Error ? error.message : "Unknown error occurred"
    };
  }
}