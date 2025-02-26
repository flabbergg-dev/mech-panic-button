"use server"

import { prisma } from "@/lib/prisma"

export async function getChatByUserIdAction(userId: string, mechanicId: string) {
    try {
        const chat = await prisma.chat.findFirst({
            where: {
            OR: [
                { customerId: userId },
                { mechanicId: mechanicId }
            ]
            },
            select: {
            id: true,
            customerId: true,
            mechanicId: true,
            }
        })
        if(chat) {
            return {
                success: true,
                chat
            }
        } else {
            return {
                success: false,
                error: "Chat not found"
            }
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