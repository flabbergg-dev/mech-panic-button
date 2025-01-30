"use server"

import { prisma } from "@/lib/prisma"

export async function getChatByUserIdAction(userId: string) {
    try {
        const chat = await prisma.chat.findFirst({
            where: { users: { some: { id: userId } } },
            select: {
                id: true,
                customerId: true,
                mechanicId: true,
                messages: true,
                users: true,
            },
        })
        return {
            success: true,
            chat,
        }
    }
    catch (error) {
        console.error("Error in getChatAction:", error)
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to fetch chat",
        }
    }
}