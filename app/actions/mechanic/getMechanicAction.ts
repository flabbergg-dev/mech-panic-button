"use server"

import { prisma } from "@/lib/prisma"

export async function getMechanicAction(mechanicId: string) {
  try {
    const mechanic = await prisma.mechanic.findUnique({
      where: {
        userId: mechanicId,
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
        isApproved: true,
        location: true,
        serviceArea: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            phoneNumber: true
          }
        }
      }
    })

    if (!mechanic) {
      throw new Error("Mechanic not found")
    }

    return {
      mechanic
    }
  } catch (error) {
    console.error("Error in getMechanicAction:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch mechanic data"
    }
  }
}
