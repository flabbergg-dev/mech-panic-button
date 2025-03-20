"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { clerkClient } from "@clerk/nextjs/server"
import {auth } from "@clerk/nextjs/server"
import type { UserRole } from "@prisma/client"

type UpdateUserProps = {
  id?: string
  email?: string
  data: {
    firstName?: string
    lastName?: string
    phoneNumber?: string
    dob?: Date
    profileImage?: string
    documentsUrl?: string[]
    role?: UserRole
  }
}

export async function updateUserAction({ id, email, data }: UpdateUserProps) {
  try {
    const clerk = await clerkClient();
    const { userId : authorizedUser } = await auth()
    if (!authorizedUser) {
      throw new Error("Unauthorized")
    }
    if (!id && !email) {
      throw new Error("Either user id or email must be provided")
    }

    // Update user in database
    const user = await prisma.user.update({
      where: id ? { id } : { email },
      data,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        dob: true,
        phoneNumber: true,
        role: true
      }
    })

      await clerk.users.updateUser(user.id, {
        firstName: data.firstName,
        lastName: data.lastName,
        publicMetadata: {
          ...user,
          updatedAt: new Date()
        }
      })

    if (id) {
      revalidatePath(`/dashboard/user/${id}`)
      revalidatePath(`/dashboard/user/${id}?view=settings`)
    }

    return {
      success: true,
      user
    }
  } catch (error) {
    console.error("Error in update user action:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update user"
    }
  }
}
