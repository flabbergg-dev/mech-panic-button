'use server'

import { ServiceStatus, OfferStatus } from '@prisma/client'
import { prisma } from "@/lib/prisma"

type CreateServiceOfferInput = {
  mechanicId: string
  serviceRequestId: string
  price: number
  note?: string
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
    if (!input.mechanicId || !input.serviceRequestId || !input.price) {
      throw new Error("Invalid input: mechanicId, serviceRequestId, and price are required")
    }

    // Verify service request exists and is in REQUESTED status
    const serviceRequest = await prisma.serviceRequest.findUnique({
      where: { id: input.serviceRequestId },
      include: { offers: true }
    })

    if (!serviceRequest) {
      throw new Error("Service request not found")
    }

    if (serviceRequest.status !== ServiceStatus.REQUESTED && serviceRequest.status !== ServiceStatus.OFFERED) {
      throw new Error("Service request is not in REQUESTED neither in OFFERED status")
    }

    // Create the offer
    const offer = await prisma.serviceOffer.create({
      data: {
        mechanicId: input.mechanicId,
        serviceRequestId: input.serviceRequestId,
        price: input.price,
        note: input.note,
        expiresAt: input.expiresAt,
        status: OfferStatus.PENDING
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
