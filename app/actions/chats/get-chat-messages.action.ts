"use server"

import { prisma } from "@/lib/prisma"

export async function getChatMessages(chatId: number) {
  try {
    const messages = await prisma.message.findMany({
      where: {
        chatId: chatId
      },
      select: {
        id: true,
        chatId: true,
        authorId: true,
        content: true,
      }
    })

    if (!messages) {
      throw new Error("Messages not found")
    }

    return {
      success: true,
      messages,
    }
  }
  catch (error) {
    console.error("Error in getChatMessagesAction:", error ?? "Unknown error")
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch messages",
    }
  }
}