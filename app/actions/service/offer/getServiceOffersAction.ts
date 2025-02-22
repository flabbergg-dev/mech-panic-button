'use server'

import { prisma } from "@/lib/prisma"
import { OfferStatus } from "@prisma/client"

export type EnrichedServiceOffer = {
  id: string
  serviceRequestId: string
  mechanicId: string | null
  status: OfferStatus
  price: number
  note: string | null
  expiresAt: Date | null
  createdAt: Date
  updatedAt: Date
  location: {latitude: number, longitude: number} | null
  mechanic?: {
    id: string
    rating: number | null
    user: {
      firstName: string
      lastName: string
      stripeCustomerId: string | null | undefined
    } | null
  } | null
}

export async function getServiceOffersForClient(serviceRequestId: string) {
  console.log('Fetching offers for service request:', serviceRequestId)
  
  // Get all pending offers for this service request that haven't expired
  const offers = await prisma.serviceOffer.findMany({
    where: {
      serviceRequestId: serviceRequestId,
      status: { in: [OfferStatus.PENDING, OfferStatus.ACCEPTED] },
      expiresAt: {
        gt: new Date() // Only get non-expired offers
      },
     
    },
    orderBy: {
      createdAt: 'asc'
    },
    take: 4 // Limit to 4 offers as per requirement
  })

  // For pending offers, fetch mechanic details
  const enrichedOffers = await Promise.all(
    offers.map(async (offer): Promise<EnrichedServiceOffer> => {
      const location = typeof offer.location === 'object' && offer.location 
        ? offer.location as { latitude: number; longitude: number }
        : null;

      if (!offer.mechanicId) {
        return { ...offer, location };
      }

      const mechanic = await prisma.mechanic.findUnique({
        where: { id: offer.mechanicId },
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              stripeCustomerId: true
            }
          }
        }
      })

      return {
        ...offer,
        location,
        mechanic: mechanic
      }
    })
  )
  return enrichedOffers
}
