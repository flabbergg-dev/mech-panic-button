"use server"

import { prisma } from "@/lib/prisma"

export async function getStripeCustomerId(mechanicId: string) {
    if (!mechanicId) throw new Error("Missing parameters")
    const response = await prisma.user.findUnique({
    where: {
        id: mechanicId
    },
    select: {
        stripeCustomerId: true
    }
    })

    console.log(response)

  return response
}
