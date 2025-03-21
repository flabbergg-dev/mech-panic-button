'use server'

import { prisma } from "@/lib/prisma"
import { BookingStatus } from "@prisma/client"
import { auth } from "@clerk/nextjs/server"

export async function cancelBookingRequestAction(bookingId: string) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return { success: false, error: "Unauthorized: User not authenticated" }
    }

    // Find the booking and update its status
    const updatedBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: { status: BookingStatus.CANCELLED }
    })

    window.history.back()
    
    return { success: true, booking: updatedBooking }
  } catch (error) {
    console.error("Error cancelling booking request:", error)
    return { success: false, error: "Failed to cancel booking request" }
  }
}
