'use server'

import { ServiceStatus, OfferStatus, Prisma } from '@prisma/client'
import { prisma } from "@/lib/prisma"


type CreateServiceOfferInput = {
  mechanicId: string
  serviceRequestId: string
  price: number
  note?: string
  location: {
    latitude: number
    longitude: number
  }
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
      where: { id: input.mechanicId },
      select: { 
        isAvailable: true 
      }
    })

    if (!mechanic) {
      throw new Error("Mechanic not found")
    }

    if (!input.location || !input.location.latitude || !input.location.longitude || 
        (input.location.latitude === 0 && input.location.longitude === 0)) {
      throw new Error("Valid mechanic location is required")
    }

    // Verify service request exists and is in REQUESTED status
    const serviceRequest = await prisma.serviceRequest.findUnique({
      where: { id: input.serviceRequestId },
      include: { offers: true }
    })

    if (!serviceRequest) {
      throw new Error("Service request not found: #ERR07")
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
        },
      }
    })

    return {
      success: true,
      data: offer
    }
  } catch (error) {
    console.log(input)
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
    // Get the service request first to check its status
    const serviceRequest = await prisma.serviceRequest.findUnique({
      where: { id: serviceRequestId },
      include: { offers: true }
    });

    if (!serviceRequest) {
      throw new Error("Service request not found");
    }

    // Check if the request is already in a final state
    if (serviceRequest.status === ServiceStatus.PAYMENT_AUTHORIZED || 
        serviceRequest.status === ServiceStatus.IN_ROUTE ||
        serviceRequest.status === ServiceStatus.IN_PROGRESS ||
        serviceRequest.status === ServiceStatus.COMPLETED ) {
      throw new Error("Service request is already in progress or completed");
    }

    // Get pending offers for this request
    const serviceOffer = await prisma.serviceOffer.findMany({
      where: { 
        AND: { 
          serviceRequestId: serviceRequestId, 
          status: OfferStatus.PENDING
        } 
      },
      orderBy: { createdAt: 'desc' },
      include: {
        mechanic: true,
        serviceRequest: true
      }
    });

    if (!serviceOffer || serviceOffer.length === 0) {
      throw new Error("No pending offers found for this service request. The offer may have expired or been handled by another action.");
    }

    const latestOffer = serviceOffer[0];

    if (accepted) {
      try {
        // Accept the offer in a transaction
        await prisma.$transaction([
          // Update the offer status
          prisma.serviceOffer.update({
            where: { 
              id: latestOffer.id,
              status: OfferStatus.PENDING // Only update if still pending
            },
            data: { status: OfferStatus.ACCEPTED }
          }),
          // Update the service request status and mechanic
          prisma.serviceRequest.update({
            where: { 
              id: serviceRequestId,
              status: ServiceStatus.REQUESTED // Only update if still in REQUESTED state
            },
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
        ]);
      } catch (transactionError) {
        console.error("Transaction error:", transactionError);
        throw new Error("Could not accept offer - the request status may have changed. Please try again.");
      }
    } else {
      try {
        // Decline the offer in a transaction
        await prisma.$transaction([
          // Update the offer status
          prisma.serviceOffer.update({
            where: { 
              id: latestOffer.id,
              status: OfferStatus.PENDING // Only update if still pending
            },
            data: { status: OfferStatus.DECLINED }
          }),
          // Reset the service request to REQUESTED status and clear mechanic
          prisma.serviceRequest.update({
            where: { 
              id: serviceRequestId,
              mechanicId: latestOffer.mechanicId // Only update if this mechanic's offer
            },
            data: {
              status: ServiceStatus.REQUESTED,
              mechanicId: null
            }
          })
        ]);
      } catch (transactionError) {
        console.error("Transaction error:", transactionError);
        throw new Error("Could not decline offer - the request status may have changed. Please try again.");
      }
    }

    return {
      success: true,
      data: {
        status: accepted ? 'accepted' : 'declined'
      }
    };
  } catch (error) {
    console.error("Error in handleServiceOfferAction:", error);
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'An unknown error occurred' };
  }
}
