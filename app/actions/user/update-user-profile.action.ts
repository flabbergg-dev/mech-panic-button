"use server"

import { auth } from "@clerk/nextjs/server"
import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { type UpdateUserProfile, updateUserSchema } from "@/schemas/users/userProfileSchema"
import  { type UpdateMechanicProfile, updateMechanicProfileSchema } from "@/schemas/mechanics/mechanicProfileSchema"
import { uploadDocuments } from "../mechanic/upload-documents"

export async function updateUserProfileAction(
  data: UpdateUserProfile | UpdateMechanicProfile,
  isMechanic: boolean,
  driversLicense: File | null,
  merchantDocument: File | null
) {
  try {
    const validatedData = isMechanic
      ? updateMechanicProfileSchema.parse(data)
      : updateUserSchema.parse(data)

    const session = await auth()
    if (!session || !session.userId) {
      throw new Error("Unauthorized")
    }

    const userId = session.userId

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { mechanic: true },
    })

    if (!user) {
      throw new Error("User not found")
    }

    if (isMechanic && !user.mechanic) {
      throw new Error("User is not a mechanic")
    }

    if (isMechanic) {
      await uploadDocuments(userId, driversLicense, merchantDocument)
    }

    const updatedProfile = await prisma.user.update({
      where: { id: userId },
      data: {
        email: validatedData.email,
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        documentsUrl: validatedData.documentsUrl,
        mechanic: isMechanic ? {
          update: {
            bio: (validatedData as UpdateMechanicProfile).bio,
            isAvailable: (validatedData as UpdateMechanicProfile).isAvailable,
          }
        } : undefined,
      },
    })

    if (isMechanic) {
      revalidatePath(`/dashboard/mechanic/${userId}`)
    } else {
      revalidatePath(`/dashboard/customer/${userId}`)
    }

    return { success: true, data: updatedProfile }
  } catch (error) {
    console.error("Error updating user profile:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update profile",
    }
  }
}