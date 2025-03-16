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
    console.log('Starting getServiceRequestsAction');
    
    // Get the current mechanic's location from their profile
    const { userId } = await auth();
    if (!userId) {
      console.log('No authenticated user found');
      throw new Error("No authenticated user found");
    }

    const mechanic = await prisma.mechanic.findUnique({
      where: { userId },
      select: { 
        location: true,
        id: true
      }
    });

    console.log('Found mechanic:', mechanic);

    if (!mechanic) {
      console.log('Mechanic not found');
      return {
        serviceRequests: [],
        error: "Mechanic not found"
      };
    }

    if (!mechanic.location || typeof mechanic.location !== 'object') {
      console.log('Mechanic location not set');
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
      console.log('Invalid mechanic location coordinates');
      return {
        serviceRequests: [],
        error: "Invalid mechanic location coordinates"
      };
    }

    console.log('Mechanic location:', mechanicLocation);

    // Get all service requests with appropriate statuses
    const serviceRequests = await prisma.serviceRequest.findMany({
      where: {
        OR: [
          // New requests that need attention
          { status: ServiceStatus.REQUESTED },
          // Requests in various active states for this mechanic
          {
            mechanicId: mechanic.id,
            status: {
              in: [
                ServiceStatus.ACCEPTED,
                ServiceStatus.PAYMENT_AUTHORIZED,
                ServiceStatus.IN_ROUTE,
                ServiceStatus.SERVICING,
                ServiceStatus.IN_PROGRESS,
                ServiceStatus.IN_COMPLETION
              ]
            }
          }
        ]
      },
      include: {
        client: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            phoneNumber: true
          }
        }
      }
    });

    console.log('Raw service requests from DB:', JSON.stringify({
      total: serviceRequests.length,
      byStatus: serviceRequests.reduce((acc, req) => {
        acc[req.status] = (acc[req.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      requests: serviceRequests
    }, null, 2));

    // Filter requests by distance
    const nearbyRequests = serviceRequests.filter(request => {
      if (!request.location || typeof request.location !== 'object') {
        console.log('Request has no location:', request.id);
        return true; // Temporarily return true to see if location is the issue
      }

      const requestLocation = request.location as unknown as Location;
      if (!requestLocation || 
          typeof requestLocation.latitude !== 'number' || 
          typeof requestLocation.longitude !== 'number' ||
          Number.isNaN(requestLocation.latitude) || 
          Number.isNaN(requestLocation.longitude)) {
        console.log('Invalid request location coordinates:', request.id);
        return true; // Temporarily return true to see if location is the issue
      }

      const distance = calculateDistance(
        mechanicLocation,
        requestLocation
      );

      const isNearby = distance <= 50; // 50 mile radius
      console.log(`Request ${request.id} distance: ${distance} miles, isNearby: ${isNearby}`);
      return true; // Temporarily return true to see if distance is the issue
    });

    console.log('Filtered nearby requests:', nearbyRequests);

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