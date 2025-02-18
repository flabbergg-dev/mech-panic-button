'use server'

import { prisma } from "@/lib/prisma"

export async function deleteServiceOfferAction(serviceRequestId: string) {

    const deletedOffers = await prisma.serviceOffer.delete({
        where: {
            id: serviceRequestId
        }
    })

    console.log(`Deleted service offer with id: ${serviceRequestId}`)

    return deletedOffers
}
