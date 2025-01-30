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

        const [chatUser, chatMechanic] = await Promise.all([
            prisma.chatUser.create({
            data: {
                id: undefined,
                chatId: chat.id,
                userId: userId,
            },
            }),
            prisma.chatUser.create({
            data: {
                id: undefined,
                chatId: chat.id,
                userId: mechanicId,
            },
            })
        ])

        return {
            success: true,
            chat,
            chatUser,
            chatMechanic,
        }

    } catch (error) {
        console.error("Error in createChatWithUserAction:", error)
        return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch mechanic",
        }
    }
}