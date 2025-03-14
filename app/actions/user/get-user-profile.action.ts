"use server"

import { prisma } from "@/lib/prisma"

export async function getUserProfileAction(userId: string) {
  try {
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        firstName: true,
        lastName: true,
        email: true,
        phoneNumber: true,
        dob: true,
        currentLocation: true,
        documentsUrl: true,
        profileImage: true,
      },
    })

    if (!user) {
      throw new Error("User not found")
    }

    const formattedData = {
      ...user,
      dob: user.dob ? user.dob.toISOString().split('T')[0] : '',
    }

    return {
      success: true,
      data: formattedData,
    }
  } catch (error) {
    console.error("Error in getUserProfileAction:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch profile",
    }
  }
}
