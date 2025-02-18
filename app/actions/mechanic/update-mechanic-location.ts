"use server"

import { prisma } from "@/lib/prisma"

interface UpdateUserCurrentLocationProps {
    mechanicId: string
    newLocation: {
        latitude: number
        longitude: number
    }
}

export async function updateMechanicLocation({mechanicId, newLocation}: UpdateUserCurrentLocationProps) {
    try {
        const MechanicLocation = await prisma.mechanic.update({
            where: {
                id: mechanicId,
            },
            data: {
                location: {
                    create: {
                        latitude: newLocation.latitude,
                        longitude: newLocation.longitude,
                    },
                }
            },
        })

        return {
            MechanicLocation,
        }
    } catch (error) {
        console.error("Error in update mechanic location action:", error)
        return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch Mechanic Location",
        }
    }
}