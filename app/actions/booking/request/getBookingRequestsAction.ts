'use server'

import { prisma } from "@/lib/prisma"
import { Booking } from "@prisma/client"
import { auth } from "@clerk/nextjs/server";

export type EnrichedBooking = Booking & {
  customer?: {
    id: string
    firstName: string
    lastName: string
    email: string
    phoneNumber: string | null
  } | null
  mechanic?: {
    id: string
    user: {
      id: string
      firstName: string
      lastName: string
      stripeCustomerId: string | null
    } | null
    rating: number | null
  } | null
}

export async function getBookingRequestsAction(): Promise<EnrichedBooking[] | null> {
  try {
    const { userId } = await auth();

    if (!userId) {
      throw new Error("No authenticated user found");
    }

    const mechanicInfo = await prisma.mechanic.findUnique({
      where: {
        userId: userId
      },
      select: {
        id: true,
      }
    })

    if (!mechanicInfo) {
      return null
    }

    const requests = await prisma.booking.findMany({
      where: {
        mechanicId: mechanicInfo.id
      },
      include: {
        customer: true,
        mechanic: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                stripeCustomerId: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
    return requests
  } catch (error) {
    console.error('Error fetching booking requests:', error)
    return null
  }
}
