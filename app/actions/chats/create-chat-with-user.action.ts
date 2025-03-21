"use server"

import { prisma } from "@/lib/prisma"

export async function createChatWithUserAction(userId: string, mechanicId: string) {
    try {
        if (!userId || !mechanicId) {
            throw new Error("userId and mechanicId must be provided");
        }

        // Check if a chat already exists between the user and mechanic
        const existingChat = await prisma.chat.findFirst({
            where: {
                customerId: userId,
                mechanicId: mechanicId,
            },
        });

        if (existingChat) {
            return {
                success: false,
                error: "A chat already exists between users.",
                chat: existingChat, // Return the existing chat if needed
            };
        }

        const chat = await prisma.chat.create({
            data: {
                mechanicId: mechanicId,
                customerId: userId,
            },
        })

        return {
            success: true,
            chat,
        }

    } catch (error) {
        console.error("Error in createChatWithUserAction:", error ?? "Unknown error")
        return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch mechanic",
        }
    }
}