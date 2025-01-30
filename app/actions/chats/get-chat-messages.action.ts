"use server"

import { prisma } from "@/lib/prisma"

export async function getChatMessages(
  chatId: number,
  authorId: string
) {
  const messages = await prisma.message.findMany({
    where: {
      chatId: chatId,
      authorId: authorId
    },
    select: {
      id: true,
      chatId: true,
      authorId: true,
      content: true,
    }
  })

  return {
    success: true,
    messages,
  }
}