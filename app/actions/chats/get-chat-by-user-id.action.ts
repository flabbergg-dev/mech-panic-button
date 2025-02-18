"use server"

import { prisma } from "@/lib/prisma"

export async function getChatByUserIdAction(userId: string, mechanicId: string) {
    try {
        const chat = await prisma.chat.findUnique({
            where: { customerId_mechanicId: { customerId: userId, mechanicId: mechanicId } },
            select: {
                id: true,
                customerId: true,
                mechanicId: true,
            }
        })
        return {
            chat,
        }
    }
    catch (error) {
        console.error("Error in getChatAction:", error)
        return {
            error: error instanceof Error ? error.message : "Failed to fetch chat",
        }
    }
}