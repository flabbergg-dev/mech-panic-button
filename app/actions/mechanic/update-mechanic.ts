"use server"

import { prisma } from "@/lib/prisma"
import type { ServiceType } from "@prisma/client"
import { revalidatePath } from "next/cache"

type UpdateMechanicProps = {
  id?: string
  userId?: string
  data: {
    bio?: string
    isAvailable?: boolean
    servicesOffered?: ServiceType[]
    serviceArea?: {
      latitude: number
      longitude: number
    }
    bannerImage?: string
    driversLicenseId?: string
    merchantDocumentUrl?: string
    isApproved?: boolean
  }
}

export async function updateMechanicAction({ id, userId, data }: UpdateMechanicProps) {
  try {
    if (!id && !userId) {
      throw new Error("Either mechanic id or userId must be provided")
    }

    const mechanic = await prisma.mechanic.update({
      where: id ? { id } : { userId },
      data,
      select: {
        id: true,
        userId: true,
        bio: true,
        isAvailable: true,
        servicesOffered: true,
        serviceArea: true,
        bannerImage: true,
        driversLicenseId: true,
        merchantDocumentUrl: true,
        isApproved: true
      }
    })

    if (userId) {
      revalidatePath(`/dashboard/mechanic/${userId}`)
      revalidatePath(`/dashboard/mechanic/${userId}?view=settings`)
    }

    return {
      success: true,
      mechanic
    }
  } catch (error) {
    console.error("Error in update mechanic action:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update mechanic"
    }
  }
}
