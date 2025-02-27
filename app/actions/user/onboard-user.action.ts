"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { auth, clerkClient } from "@clerk/nextjs/server"

// Validation schema for onboarding data
const onboardingSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  role: z.enum(["Customer", "Mechanic"]),
  stripeCustomerId: z.string().optional(),
  stripeConnectId: z.string().optional(),
})

type OnboardingData = z.infer<typeof onboardingSchema>

interface OnboardingResponse {
  success: boolean
  error?: string
  validationErrors?: z.ZodIssue[]
  redirect?: string
}

export async function onboardUserAction(data: OnboardingData): Promise<OnboardingResponse> {
  try {
    const client = await clerkClient()
    const {userId} = await auth()
    if (!userId) {
      return {
        success: false,
        error: 'Unauthorized'
      }
    }
    const clerkUser = await client.users.getUser(userId)
    // Validate input data
    const validatedData = onboardingSchema.parse(data)

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: { email: validatedData.email },
    })

    if (existingUser) {
      return {
        success: true,
        redirect: '/dashboard'
      }
    }

    if (!userId) {
      return {
        success: false,
        error: 'Unauthorized'
      }
    }
    // Create user profile in database
    const user = await prisma.user.create({
      data: {
      id: clerkUser.id,
      firstName: validatedData.firstName,
      lastName: validatedData.lastName,
      email: validatedData.email,
      role: validatedData.role,
      profileImage: clerkUser.imageUrl,
      documentsUrl: [],
      currentLocation: undefined,
      stripeCustomerId: validatedData.stripeCustomerId || null,
      stripeConnectId: validatedData.stripeConnectId || null,
      },
    })

    // Update Clerk metadata with the user's role
    await client.users.updateUser(userId, {
      firstName: validatedData.firstName,
      lastName: validatedData.lastName,
      publicMetadata: { role: validatedData.role }
    })

    // If user is a mechanic, create mechanic profile
    try {
      if (validatedData.role === "Mechanic") {

      await prisma.mechanic.create({
        data: {
          userId: user.id,
          servicesOffered: [],
          isAvailable: false,
          updatedAt: new Date(),
        },
      })

      }
    } catch (error) {
      console.error("Error creating mechanic profile:", error)
      return {
      success: false,
      error: "Failed to create mechanic profile",
      }
    }

    revalidatePath('/dashboard')
    revalidatePath(`/dashboard/${validatedData.role.toLowerCase()}`)

    return {
      success: true,
      redirect: '/dashboard'
    }
  } catch (error) {
    console.error("Error in onboardUserAction:", error)
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: "Invalid input data",
        validationErrors: error.errors,
      }
    }
    return {
      success: false,
      error: "Failed to create user",
    }
  }
}
