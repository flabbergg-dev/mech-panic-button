"use server"
import { prisma } from "@/lib/prisma"
import { auth } from "@clerk/nextjs/server"
import { OfferStatus } from "@prisma/client"

export async function  updateOfferStatus(offerId: string, status: OfferStatus) {
    try {
        // check if user is logged in
        const { userId } = await auth()

        if (!userId) {
            return null
        }
        // check if offer exists
        const offer = await prisma.serviceOffer.findUnique({
            where: { id: offerId }
        })

        if (!offer) {
            return null
        }

        // update offer status
        const updatedOffer = await prisma.serviceOffer.update({
            where: { id: offerId },
            data: { status: status }
        })

        return updatedOffer
 
    } catch (error) {
        console.log(error)
    }
 
}
