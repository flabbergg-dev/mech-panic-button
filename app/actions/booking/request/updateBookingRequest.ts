'use server'

import { prisma } from "@/lib/prisma"
import { BookingStatus } from "@prisma/client"
import { auth } from "@clerk/nextjs/server"
import { revalidatePath } from "next/cache"

export async function updateBookingRequestAction(
  bookingId: string,
  data: Partial<{
    status: BookingStatus;
    notes: string;
    scheduledStart: Date;
    scheduledEnd: Date;
    totalPrice: number;
    location: any;
  }>
) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return { success: false, error: "Unauthorized: User not authenticated" }
    }

    // Find the booking and update only the provided fields
    const updatedBooking = await prisma.booking.update({
      where: { id: bookingId },
      data
    })
    
    return { success: true, booking: updatedBooking }
  } catch (error) {
    console.error("Error updating booking request:", error)
    return { success: false, error: "Failed to update booking request" }
  }
}
