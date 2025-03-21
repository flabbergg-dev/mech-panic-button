"use server"

import { prisma } from "@/lib/prisma"

export async function getAvailableMechanicsListAction() {
    try {
        const mechanic = await prisma.mechanic.findMany({
            where: {
                isAvailable: true
            },
            select: {
                id: true,
                userId: true,
                bio: true,
                servicesOffered: true,
                isAvailable: true,
                rating: true,
                bannerImage: true,
                location: true,
                serviceArea:true,
                driversLicenseId: true,
                merchantDocumentUrl: true,
                user: {
                    select: {
                        firstName: true,
                        lastName: true,
                        role: true,
                        stripeSubscriptionPlan: true,
                        stripeSubscriptionId: true,
                        stripeSubscriptionStatus: true
                    }
                },
                serviceRequests: true,
            },
        })

        if (!mechanic) {
            throw new Error("Mechanic not found")
        }

        // Log the mechanics data for debugging
        console.log("Mechanics data:", JSON.stringify(mechanic.map(m => ({
            id: m.id,
            userId: m.userId,
            role: m.user?.role,
            subscriptionPlan: m.user?.stripeSubscriptionPlan,
            isAvailable: m.isAvailable
        })), null, 2));

        return {
            mechanic,
        }
    } catch (error) {
        console.error("Error in get Mechanic List Action:", error)
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to fetch mechanic",
        }
    }
}