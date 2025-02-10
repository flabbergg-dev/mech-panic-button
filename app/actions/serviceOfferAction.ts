'use server'

import { ServiceStatus, OfferStatus, Prisma } from '@prisma/client'
import { prisma } from "@/lib/prisma"


type Location = {
  latitude: number
  longitude: number
}
type CreateServiceOfferInput = {
  mechanicId: string
  serviceRequestId: string
  price: number
  note?: string
  location: Location
  expiresAt?: Date

}

type ServiceOfferResponse = {
  success: boolean
  data?: any
  error?: string
}


export async function createServiceOfferAction(input: CreateServiceOfferInput): Promise<ServiceOfferResponse> {
  try {
    // Validate input
    if (!input.mechanicId || !input.serviceRequestId || !input.price ) {
      throw new Error("Invalid input: mechanicId, serviceRequestId, and price are required")
    }

    // Get mechanic's current location
    const mechanic = await prisma.mechanic.findUnique({
      where: { userId: input.mechanicId },
      select: { 
        isAvailable: true 
      }
    })

    if (!mechanic) {
      throw new Error("Mechanic not found")
    }

    if (!input.location) {
      throw new Error("Mechanic location not available")
    }

    // Parse and validate location
    const location = input.location as Location
    if (!location.latitude || !location.longitude) {
      throw new Error("Invalid mechanic location")
    }

    // Verify service request exists and is in REQUESTED status
    const serviceRequest = await prisma.serviceRequest.findUnique({
      where: { id: input.serviceRequestId },
      include: { offers: true }
    })

    if (!serviceRequest) {
      throw new Error("Service request not found")
    }

    if (serviceRequest.status !== ServiceStatus.REQUESTED) {
      throw new Error("Service request is not in REQUESTED status")
    }

    // Create the offer with mechanic's current location
    const offer = await prisma.serviceOffer.create({
      data: {
        mechanicId: input.mechanicId,
        serviceRequestId: input.serviceRequestId,
        price: input.price,
        note: input.note,
        expiresAt: input.expiresAt,
        status: OfferStatus.PENDING,
        location: {
          latitude: input.location.latitude,
          longitude: input.location.longitude
        }
      }
    })

    return {
      success: true,
      data: offer
    }
  } catch (error) {
    console.error("Error in createServiceOfferAction:", error)
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'An unknown error occurred' }
  }
}

export async function handleServiceOfferAction(
  serviceRequestId: string,
  accepted: boolean
): Promise<ServiceOfferResponse> {
  try {
    // Get the service offer by serviceRequestId
    const serviceOffer = await prisma.serviceOffer.findMany({
      where: { AND: { serviceRequestId: serviceRequestId, status: OfferStatus.PENDING} },
      include: {
        mechanic: true,
        serviceRequest: true
      }
    })

    if (!serviceOffer || serviceOffer.length === 0) {
      throw new Error("Service offer not found")
    }

    const latestOffer = serviceOffer[0]
    if (!latestOffer) {
      throw new Error("No offer found for this service request")
    }

    if (accepted) {
      // Accept the offer
      await prisma.$transaction([
        // Update the offer status
        prisma.serviceOffer.update({
          where: { id: latestOffer.id },
          data: { status: OfferStatus.ACCEPTED }
        }),
        // Update the service request
        prisma.serviceRequest.update({
          where: { id: serviceRequestId },
          data: {
            status: ServiceStatus.ACCEPTED,
            mechanicId: latestOffer.mechanicId
          }
        }),
        // Remove other offers
        prisma.serviceOffer.deleteMany({
          where: {
            serviceRequestId: serviceRequestId,
            id: { not: latestOffer.id },
            status: OfferStatus.PENDING
          }
        })
      ])
    } else {
      // Decline the offer
      await prisma.$transaction([
        // Update the offer status
        prisma.serviceOffer.update({
          where: { id: latestOffer.id },
          data: { status: OfferStatus.DECLINED }
        }),
        // Reset the service request to REQUESTED status
        prisma.serviceRequest.update({
          where: { id: serviceRequestId },
          data: {
            mechanicId: null,
            status: ServiceStatus.REQUESTED,
            
          }
        })
      ])
    }

    return {
      success: true,
      data: {
        status: accepted ? 'accepted' : 'declined'
      }
    }
  } catch (error) {
    console.error("Error in handleServiceOfferAction:", error)
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'An unknown error occurred' }
  }
}
