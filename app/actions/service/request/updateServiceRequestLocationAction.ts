'use server'

import { prisma } from "@/lib/prisma"
import { auth } from "@clerk/nextjs/server"

type Location = {
  latitude: number;
  longitude: number;
}

type UpdateLocationResponse = {
  success: boolean;
  error?: string;
}

export async function updateServiceRequestLocationAction(
  serviceRequestId: string,
  location: Location
): Promise<UpdateLocationResponse> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { 
        success: false, 
        error: "Authentication required" 
      };
    }

    // Validate the location data
    if (!location || 
        typeof location.latitude !== 'number' || 
        typeof location.longitude !== 'number' ||
        Number.isNaN(location.latitude) || 
        Number.isNaN(location.longitude)) {
      return {
        success: false,
        error: "Invalid location coordinates"
      };
    }

    // Update the service request location
    await prisma.serviceRequest.update({
      where: { id: serviceRequestId },
      data: { location }
    });

    return { success: true };
  } catch (error) {
    console.error("Error updating service request location:", error);
    return { 
      success: false, 
      error: "Failed to update service request location" 
    };
  }
}
