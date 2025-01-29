"use server"

import { prisma } from "@/lib/prisma"

export async function createChatWithUserAction(userId: string, mechanicId: string) {
    try {
        const chat = await prisma.chat.create({
            data: {
                id: undefined,
                customerId: userId,
                mechanicId: mechanicId,
            },
        })

        return {
            success: true,
            chat,
        }
    } catch (error) {
        console.error("Error in getMechanicByIdAction:", error)
        return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch mechanic",
        }
    }
}