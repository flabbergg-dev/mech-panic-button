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

    if (serviceRequest.status !== ServiceStatus.REQUESTED) {
      throw new Error("Service request is not in REQUESTED status")
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

    // Update service request status to OFFERED
    await prisma.serviceRequest.update({
      where: { id: input.serviceRequestId },
      data: {
        mechanicId: input.mechanicId,
        status: ServiceStatus.OFFERED,
        offeredPrice: input.price,
        offerNote: input.note,
        offerExpiry: input.expiresAt
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
    // Get the service request and its latest offer
    const serviceRequest = await prisma.serviceRequest.findUnique({
      where: { id: serviceRequestId },
      include: {
        offers: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    })

    if (!serviceRequest) {
      throw new Error("Service request not found")
    }

    const latestOffer = serviceRequest.offers[0]
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
            offeredPrice: null,
            offerNote: null,
            offerExpiry: null
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
