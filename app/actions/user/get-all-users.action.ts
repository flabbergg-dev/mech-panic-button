"use server"

import { prisma } from "@/lib/prisma"

export async function getAllUsersAction() {
    try {
        console.log("Fetching all users")

        const users = await prisma.user.findMany({
        select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phoneNumber: true,
            role: true,
            currentLocation: true,
            createdAt: true,
            updatedAt: true,
        },
        })

        console.log("Database result:", users)

        if (!users) {
        console.error("Users not found")
        throw new Error("Users not found")
        }

        return {
            success: true,
            data: users,
        }
    } catch (error) {
        console.error("Error in getAllUsersAction:", error)
        return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch users",
        }
    }
    }