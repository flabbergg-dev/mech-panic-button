"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function updateProfileImageAction(userId: string, imageUrl: string) {
  if (!userId || !imageUrl) {
    return {
      success: false,
      error: "Missing required data",
    }
  }

  try {
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        profileImage: imageUrl,
      },
      select: {
        id: true,
        profileImage: true,
      },
    })

    revalidatePath(`/dashboard/settings`)
    revalidatePath(`/profile/${userId}`)

    return {
      success: true,
      data: user,
    }
  } catch (error) {
    console.error("Error updating profile image:", error instanceof Error ? error.message : "Unknown error")
    return {
      success: false,
      error: "Failed to update profile image",
    }
  }
}
