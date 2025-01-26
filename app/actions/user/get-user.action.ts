"use server"

import { prisma } from "@/lib/prisma"

export async function getUserAction(userId: string) {
    return await prisma.user.findUnique({
        where: {
        id: userId,
        },
        select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phoneNumber: true,
            role: true,
            profileImage: true,
            documentsUrl: true,
            dob: true,
            currentLocation: true,
            serviceArea: true,
            createdAt: true,
            updatedAt: true,
        },
    })
}