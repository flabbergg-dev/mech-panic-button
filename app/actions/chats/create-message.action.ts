"use server"

import { prisma } from "@/lib/prisma"

export async function createMessageAction(userId: string, chatId: number, content: string) {
    try {
        const message = await prisma.message.create({
            data: {
                chatId: chatId,
                authorId: userId,
                content: content,
                userId: userId,
            },
        })

        return {
            message: message,
        }
    } catch (error) {
        console.error("Error in createMessageAction:", error)
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to create message",
        }
    }
}