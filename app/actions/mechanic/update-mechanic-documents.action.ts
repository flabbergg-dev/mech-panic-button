"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

interface MechanicDocuments {
  driversLicenseId: string
  merchantDocumentUrl: string
}

export async function updateMechanicDocumentsAction(
  userId: string,
  documents: MechanicDocuments
) {
  if (!userId || !documents) {
    return {
      success: false,
      error: "Missing required data",
    }
  }

  try {
    // First check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      return {
        success: false,
        error: "User not found",
      }
    }

    // Create or update mechanic profile with documents
    const mechanic = await prisma.mechanic.upsert({
      where: { userId },
      create: {
        userId,
        driversLicenseId: documents.driversLicenseId,
        merchantDocumentUrl: documents.merchantDocumentUrl,
        servicesOffered: [],
        isAvailable: false,
        updatedAt: new Date(),
      },
      update: {
        driversLicenseId: documents.driversLicenseId,
        merchantDocumentUrl: documents.merchantDocumentUrl,
      },
      select: {
        id: true,
        driversLicenseId: true,
        merchantDocumentUrl: true,
      },
    })

    revalidatePath(`/dashboard/mechanic/${userId}`)
    revalidatePath(`/dashboard/settings`)

    return {
      success: true,
      data: mechanic,
    }
  } catch (error) {
    console.error("Error updating mechanic documents:", error instanceof Error ? error.message : "Unknown error")
    return {
      success: false,
      error: "Failed to update mechanic documents",
    }
  }
}
