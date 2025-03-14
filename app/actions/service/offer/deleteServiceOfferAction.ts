'use server'

import { prisma } from "@/lib/prisma"

export async function deleteServiceOfferAction(serviceRequestId: string) {

    const deletedOffers = await prisma.serviceOffer.delete({
        where: {
            id: serviceRequestId
        }
    })


    return deletedOffers
}
