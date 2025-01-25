"use server"

import { prisma } from "@/lib/prisma"

export async function getUserProfileAction(userId: string) {
  try {
    console.log("Fetching user profile for ID:", userId)
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        firstName: true,
        lastName: true,
        email: true,
        phoneNumber: true,
        dob: true,
        currentLocation: true,
        serviceArea: true,
        documentsUrl: true,
        profileImage: true,
      },
    })

    console.log("Database result:", user)

    if (!user) {
      console.error("User not found:", userId)
      throw new Error("User not found")
    }

    const formattedData = {
      ...user,
      dob: user.dob ? user.dob.toISOString().split('T')[0] : '',
    }

    console.log("Formatted data:", formattedData)

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
