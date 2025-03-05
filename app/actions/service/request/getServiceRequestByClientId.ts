"use server"

import { prisma } from "@/lib/prisma"

export async function getServiceRequestByClientId(clientId: string) {
    try {
        const serviceRequest = await prisma.serviceRequest.findMany({
            where: { clientId: clientId },
            select:{
                id:true,
                paymentHoldId:true,
                completionCode:true,
                status: true,
                mechanicId: true,
                mechanicLocation: true,
                createdAt: true,
                updatedAt: true,
                clientId: true,
                mechanic: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                stripeCustomerId: true
                            }
                        }
                    }
   
                }
                }})

        if (!serviceRequest) {
            console.error("Service request not found")
        }

        return { serviceRequest }
    } catch (error) {
        console.error("Error in fetching service request by client ID:", error)
    }
}