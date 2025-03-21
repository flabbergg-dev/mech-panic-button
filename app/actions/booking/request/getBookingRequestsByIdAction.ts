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

export async function getBookingRequestsByIdAction(customerId: string): Promise<EnrichedBooking | null> {
  try {
    const requests = await prisma.booking.findFirst({
      where: {
        customerId: customerId
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
      }
    })
    return requests
  } catch (error) {
    console.error('Error fetching booking requests:', error)
    return null
  }
}
