'use server'

import { prisma } from "@/lib/prisma"
import { auth } from "@clerk/nextjs/server"

interface Location {
  latitude: number;
  longitude: number;
}

export async function updateMechanicLocationAction(location: Location) {
  try {
    const { userId } = await auth();
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Validate location data
    if (!location || typeof location.latitude !== 'number' || typeof location.longitude !== 'number') {
      throw new Error("Invalid location data");
    }

    // Format location data with fixed precision
    const formattedLocation = {
      latitude: Number(location.latitude.toFixed(6)),
      longitude: Number(location.longitude.toFixed(6))
    };


    // First check if mechanic exists
    const existingMechanic = await prisma.mechanic.findUnique({
      where: { userId }
    });

    if (!existingMechanic) {
      // Create mechanic if doesn't exist
      const mechanic = await prisma.mechanic.create({
        data: {
          userId,
          location: formattedLocation
        }
      });
      return {
        success: true,
        location: mechanic.location
      };
    }

    // Update existing mechanic
    const mechanic = await prisma.mechanic.update({
      where: { userId },
      data: {
        location: formattedLocation
      }
    });


    return {
      success: true,
      location: mechanic.location
    };
  } catch (error) {
    console.error("Error updating mechanic location:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update location"
    };
  }
}
