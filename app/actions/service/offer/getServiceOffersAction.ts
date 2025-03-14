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
  location: {latitude: number, longitude: number}
  mechanic?: {
    id: string
    rating: number | null
    user: {
      firstName: string
      lastName: string
      stripeCustomerId: string | null | undefined
      stripeConnectId: string | null | undefined
    } | null
  } | null
}

export async function getServiceOffersForClient(userId: string) {
  
  try {
    // First, get all service requests for this user
    const serviceRequests = await prisma.serviceRequest.findMany({
      where: {
        clientId: userId
      },
      select: {
        id: true
      }
    })
    
    if (serviceRequests.length === 0) {
      return []
    }
    
    const serviceRequestIds = serviceRequests.map(req => req.id)
    
    // Get all pending offers for these service requests that haven't expired
    const offers = await prisma.serviceOffer.findMany({
      where: {
        serviceRequestId: { in: serviceRequestIds },
        status: { in: [OfferStatus.PENDING, OfferStatus.ACCEPTED] },
        expiresAt: {
          gt: new Date() // Only get non-expired offers
        },
      },
      orderBy: {
        createdAt: 'asc'
      }
    })
    

    // For pending offers, fetch mechanic details
    const enrichedOffers = await Promise.all(
      offers.map(async (offer): Promise<EnrichedServiceOffer> => {
        const location = offer.location as { latitude: number; longitude: number };

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
                stripeCustomerId: true,
                stripeConnectId: true
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
  } catch (error) {
    console.error('Error fetching service offers for client:', error)
    return []
  }
}