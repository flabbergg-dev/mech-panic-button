"use server"

import { prisma } from "@/lib/prisma"

export async function getServiceRequestByClientId(clientId: string) {
    try {
        const serviceRequest = await prisma.serviceRequest.findMany({
            where: { clientId: clientId },
            include: {
                // clientId: true,
                // mechanicId: true,
                // status: true,
                // location: true,
                // description: true,
                // paymentHold: true,
                payment: true,
                // arrivalCode: true,
                // completionTime: true,
                // startTime: true,
                // serviceType: true,
                // completionCode: true,
                // mechanicLocation: true,
                // totalAmount: true,   
                review: true,
                offers: true,
            }
        })

        if (!serviceRequest) {
            console.error("Service request not found")
        }

        return { serviceRequest }
    } catch (error) {
        console.error("Error in fetching service request by client ID:", error)
    }
}