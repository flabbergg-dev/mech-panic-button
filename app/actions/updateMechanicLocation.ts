'use server'

import { prisma } from '@/lib/prisma'

export async function updateMechanicLocation(
  requestId: string,
  mechanicLocation: {
    latitude: number
    longitude: number
  }
) {
  try {
    const updatedRequest = await prisma.serviceRequest.update({
      where: {
        id: requestId,
      },
      data: {
        mechanicLocation,
        updatedAt: new Date(),
      },
    })
    return { success: true, data: updatedRequest }
  } catch (error) {
    console.error('Error updating mechanic location:', error)
    return { success: false, error: 'Failed to update mechanic location' }
  }
}
