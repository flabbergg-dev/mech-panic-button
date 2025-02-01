"use server"

import { prisma } from "@/lib/prisma"

export async function getAvailableMechanicsListAction() {
    try {
        const mechanic = await prisma.mechanic.findMany({
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
                location: true,
                serviceArea: true,
            },
        })

        if (!mechanic) {
        throw new Error("Mechanic not found")
        }

        return {
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