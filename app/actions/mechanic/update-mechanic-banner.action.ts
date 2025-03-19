"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function updateMechanicBannerAction(userId: string, imageUrl: string) {
  try {
    const mechanic = await prisma.mechanic.update({
      where: { userId },
      data: { bannerImage: imageUrl },
      select: {
        id: true,
        bannerImage: true,
      },
    })

    revalidatePath(`/dashboard/mechanic/${userId}`)
    revalidatePath(`/dashboard/mechanic/${userId}/settings`)

    return {
      success: true,
      data: mechanic,
    }
  } catch (error) {
    console.error("Error updating banner image:", error)
    return {
      success: false,
      error: "Failed to update banner image",
    }
  }
}
