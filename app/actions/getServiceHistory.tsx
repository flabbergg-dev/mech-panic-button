"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@clerk/nextjs/server"

export async function getServiceHistory() {
    const { userId } = await auth()

    if (!userId) {
        throw new Error("No user found")
    }

    const response = await prisma.mechanic.findUnique({
        where: { userId },
        select: {
            serviceRequests: {
                include: {
                    client: true
                }
            }
        }
    })

    if (!response) {
        throw new Error("No service history found")
    }

    const serviceHistory = response.serviceRequests.map((request) => ({
        id: request.id,
        customerName: request.client.firstName + " " + request.client.lastName,
        serviceDate: request.createdAt.toDateString(),
        serviceType: request.serviceType,
        amount: request.totalAmount,
        status: request.status
    }))

    return serviceHistory
}