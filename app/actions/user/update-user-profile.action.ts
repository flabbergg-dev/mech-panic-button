"use server"

import { auth } from "@clerk/nextjs/server"
import { revalidatePath } from "next/cache"
import {
  UpdateUserDTO,
  UpdateMechanicDTO,
  updateUserSchema,
  updateMechanicProfileSchema,
} from "@/lib/domain/dtos/user.dto"
import { UpdateUserProfileUseCase } from "@/lib/domain/usecases/update-user-profile.usecase"
import { PrismaUserRepository } from "@/lib/infrastructure/repositories/prisma-user.repository"
import { prisma } from "@/lib/prisma"

export async function updateUserProfileAction(
  data: UpdateUserDTO | UpdateMechanicDTO,
  isMechanic: boolean
) {
  try {
    // Validate the input data
    const validatedData = isMechanic
      ? updateMechanicProfileSchema.parse(data)
      : updateUserSchema.parse(data)

    // Get the authenticated user
    const session = await auth()
    if (!session || !session.userId) {
      throw new Error("Unauthorized")
    }

    const userId = session.userId

    // Check if user exists and has the correct role
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

    // Initialize the repository and use case
    const userRepository = new PrismaUserRepository()
    const updateUserProfileUseCase = new UpdateUserProfileUseCase(userRepository)

    // Execute the use case
    const updatedProfile = await updateUserProfileUseCase.execute(
      userId,
      validatedData,
      isMechanic
    )

    // Revalidate the profile pages
    revalidatePath(`/dashboard/mechanic/${userId}`)
    revalidatePath(`/dashboard/customer/${userId}`)

    return { success: true, data: updatedProfile }
  } catch (error) {
    console.error("Error updating user profile:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update profile",
    }
  }
}
