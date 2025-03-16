"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@clerk/nextjs/server"
export async function getMechanicByIdAction() {
    const { userId } = await auth()

    try {
        if (!userId) {
            throw new Error("Unauthorized")
        }
        const mechanic = await prisma.mechanic.findFirst({
            where: {
                userId ,
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
            user: true,
            serviceRequests: true,
            availability: true,
            location: true,
            serviceArea: true,
            createdAt: true,
            updatedAt: true,
            isApproved: true,
            }
        })
        if (!mechanic) {
        console.error("Mechanic not found:", userId)
        throw new Error("Mechanic not found")
        } else {
            return {
                mechanic,
            }
        }
    } catch (error) {
        console.error("Error in getMechanicByIdAction:", error)
        return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch mechanic",
        }
    }
    }