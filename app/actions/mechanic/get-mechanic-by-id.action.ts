"use server"

import { prisma } from "@/lib/prisma"

export async function getMechanicByIdAction(userId: string) {
    try {
        console.log("Fetching mechanic profile for ID:", userId)

        const mechanic = await prisma.mechanic.findUnique({
            where: { userId: userId },
            select: {
                id: true,
                userId: true,
                bio: true,
                servicesOffered: true,
                isAvailable: true,
                rating: true,
                bannerImage: true,
                driversLicenseId: true,
                merchantDocumentUrl: true,
                earnings: true,
                user: true,
                serviceRequests: true,
                createdAt: true,
                updatedAt: true,
            }
        })

        console.log("Database result:", mechanic)

        if (!mechanic) {
        console.error("Mechanic not found:", userId)
        throw new Error("Mechanic not found")
        }

        return {
        success: true,
        data: mechanic,
        }
    } catch (error) {
        console.error("Error in getMechanicByIdAction:", error)
        return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch mechanic",
        }
    }
    }