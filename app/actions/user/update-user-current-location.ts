"use server"

import { prisma } from "@/lib/prisma"

interface UpdateUserCurrentLocationProps {
    userId: string
    newLocation: {
        latitude: number
        longitude: number
    }
}

export async function updateUserCurrentLocation({userId, newLocation}: UpdateUserCurrentLocationProps) {
    try {
        const userLocation = await prisma.user.update({
            where: {
                id: userId,
            },
            data: {
                currentLocation: {
                    create: {
                        latitude: newLocation.latitude,
                        longitude: newLocation.longitude,
                    },
                }
            },
        })

        return {
            userLocation,
        }
    } catch (error) {
        console.error("Error in update user current location action:", error)
        return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch User Location",
        }
    }
}