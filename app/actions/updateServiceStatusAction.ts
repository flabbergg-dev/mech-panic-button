'use server'

import { prisma } from "@/lib/prisma"
import { ServiceStatus, OfferStatus } from "@prisma/client"
import { generatePinCode } from "@/lib/utils"

export async function acceptServiceOffer(offerId: string, requestId: string) {
  // Start a transaction to handle both offer acceptance and other offers deletion
  return await prisma.$transaction(async (tx) => {
    // Update the accepted offer
    const acceptedOffer = await tx.serviceOffer.update({
      where: { id: offerId },
      data: { status: OfferStatus.ACCEPTED }
    })

    // Delete other offers for this request
    await tx.serviceOffer.deleteMany({
      where: {
        serviceRequestId: requestId,
        id: { not: offerId },
        status: OfferStatus.PENDING
      }
    })

    // Update service request status
    await tx.serviceRequest.update({
      where: { id: requestId },
      data: { 
        status: ServiceStatus.ACCEPTED,
        mechanicId: acceptedOffer.mechanicId,
        totalAmount: acceptedOffer.price
      }
    })

    return acceptedOffer
  })
}

export async function updateServiceToInProgress(requestId: string) {
  const verificationPin = generatePinCode()
  
  return await prisma.serviceRequest.update({
    where: { id: requestId },
    data: {
      status: ServiceStatus.IN_PROGRESS,

    }
  })
}

export async function verifyServiceStart(requestId: string, pin: string) {
  const request = await prisma.serviceRequest.findUnique({
    where: { id: requestId }
  })

  if (!request || request.arrivalCode !== pin) {
    throw new Error('Invalid verification pin')
  }

  return await prisma.serviceRequest.update({
    where: { id: requestId },
    data: {
      status: ServiceStatus.SERVICING,
      updatedAt: new Date(),
      startTime: new Date(),
      arrivalCode: pin
    }
  })
}

export async function completeService(requestId: string, pin: string) {
  const request = await prisma.serviceRequest.findUnique({
    where: { id: requestId }
  })

  if (!request || request.completionCode !== pin) {
    throw new Error('Invalid verification pin')
  }

  return await prisma.serviceRequest.update({
    where: { id: requestId },
    data: {
      status: ServiceStatus.COMPLETED,
      completionTime: new Date()
    }
  })
}

export async function updateMechanicCurrentLocation(
  mechanicId: string,
  latitude: number,
  longitude: number
) {
  return await prisma.user.update({
    where: { id: mechanicId },
    data: {
      currentLocation: {
        update: {
          latitude: latitude,
          longitude: longitude
        }
      }
    }
  })
}
