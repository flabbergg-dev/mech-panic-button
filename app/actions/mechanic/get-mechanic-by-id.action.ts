"use server"

import { prisma } from "@/lib/prisma"

export async function getMechanicByIdAction(userId: string) {
    try {
        const mechanic = await prisma.mechanic.findFirst({
            where: {
            OR: [
                { userId: userId },
                { id: userId } // Assuming userId can also be the mechanic's id
            ]
            },
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
            availability: true,
            location: true,
            serviceArea: true,
            createdAt: true,
            updatedAt: true,
            }
        })
        if (!mechanic) {
        console.error("Mechanic not found:", userId)
        throw new Error("Mechanic not found")
        }

        return {
        success: true,
        mechanic,
        }
    } catch (error) {
        console.error("Error in getMechanicByIdAction:", error)
        return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch mechanic",
        }
    }
    }