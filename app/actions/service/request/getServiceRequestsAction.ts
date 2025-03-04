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
    console.log("getServiceRequestsAction: Starting fetch");
    
    // Get the current mechanic's location from their profile
    const { userId } = await auth();
    if (!userId) {
      console.log("getServiceRequestsAction: No userId from auth");
      throw new Error("No authenticated user found");
    }
    console.log("getServiceRequestsAction: Got userId:", userId);

    const mechanic = await prisma.mechanic.findUnique({
      where: { userId },
      select: { 
        location: true,
        id: true
      }
    });

    console.log("getServiceRequestsAction: Mechanic data:", mechanic);

    if (!mechanic) {
      console.log("getServiceRequestsAction: No mechanic found for userId:", userId);
      return {
        serviceRequests: [],
        error: "Mechanic not found"
      };
    }

    if (!mechanic.location || typeof mechanic.location !== 'object') {
      console.log("getServiceRequestsAction: Invalid or missing mechanic location:", mechanic.location);
      return {
        serviceRequests: [],
        error: "Mechanic location not set"
      };
    }

    const mechanicLocation = mechanic.location as unknown as Location;
    if (!mechanicLocation || 
        typeof mechanicLocation.latitude !== 'number' || 
        typeof mechanicLocation.longitude !== 'number' ||
        isNaN(mechanicLocation.latitude) || 
        isNaN(mechanicLocation.longitude)) {
      console.log("getServiceRequestsAction: Invalid mechanic location coordinates:", mechanicLocation);
      return {
        serviceRequests: [],
        error: "Invalid mechanic location coordinates"
      };
    }

    console.log("getServiceRequestsAction: Valid mechanic location found:", mechanicLocation);

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

    console.log(`getServiceRequestsAction: Found ${serviceRequests.length} total REQUESTED service requests`);

    // Filter requests by distance
    const nearbyRequests = serviceRequests.filter(request => {
      if (!request.location || typeof request.location !== 'object') {
        console.log(`getServiceRequestsAction: Request ${request.id} has invalid location:`, request.location);
        return false;
      }

      const requestLocation = request.location as unknown as Location;
      if (!requestLocation || 
          typeof requestLocation.latitude !== 'number' || 
          typeof requestLocation.longitude !== 'number' ||
          isNaN(requestLocation.latitude) || 
          isNaN(requestLocation.longitude)) {
        console.log(`getServiceRequestsAction: Request ${request.id} has invalid location coordinates:`, requestLocation);
        return false;
      }

      const distance = calculateDistance(
        mechanicLocation,
        requestLocation
      );

      const isNearby = distance <= 50; // 50 mile radius
      if (!isNearby) {
        console.log(`getServiceRequestsAction: Request ${request.id} is too far (${distance.toFixed(2)} miles), skipping`);
      } else {
        console.log(`getServiceRequestsAction: Request ${request.id} is nearby (${distance.toFixed(2)} miles)`);
      }
      return isNearby;
    });

    console.log(`getServiceRequestsAction: Found ${nearbyRequests.length} nearby service requests within 50 miles`);

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