"use server"

import { prisma } from "@/lib/prisma"

export async function getServiceRequestById(serviceRequestId: string) {
    try {
        const serviceRequest = await prisma.serviceRequest.findUnique({
            where: { id: serviceRequestId },
            include: {
                client: true,
                mechanic: true,
                // status: true,
                // location: true,
                // description: true,
                // paymentHold: true,
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

        return {serviceRequest}
    } catch (error) {
        console.error("Error in fetching service request by ID:", error)
    }
}