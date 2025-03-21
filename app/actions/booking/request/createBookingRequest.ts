'use server'

import { prisma } from "@/lib/prisma"
import { auth } from "@clerk/nextjs/server"
import { revalidatePath } from "next/cache"
import { BookingStatus, ServiceType } from "@prisma/client"
import { addHours } from "date-fns"

export async function createBookingRequestAction({
  mechanicId,
  serviceType,
  scheduledDate,
  description,
  location
}: {
  mechanicId: string
  serviceType: string
  scheduledDate: Date
  description: string
  location: { latitude: number, longitude: number }
}) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      throw new Error("Unauthorized: User not authenticated")
    }

    const client = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!client) {
      throw new Error("Client profile not found")
    }

    // Default booking duration is 2 hours
    const scheduledEnd = addHours(scheduledDate, 2);

    const bookingRequest = await prisma.booking.create({
      data: {
        customerId: client.id,
        mechanicId: mechanicId,
        serviceType: serviceType as ServiceType,
        scheduledStart: scheduledDate,
        scheduledEnd: scheduledEnd,
        totalPrice: 0,
        notes: description,
        status: BookingStatus.PENDING,
        location: location as any
      }
    })

    revalidatePath("/dashboard")
    
    return { success: true, bookingRequest }
  } catch (error) {
    console.error("Error creating booking request:", error)
    return { success: false, error: (error as Error).message }
  }
}
