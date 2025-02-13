'use server'

import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { ServiceStatus } from '@prisma/client'

export interface MechanicProfile {
  id: string
  bannerImage?: string | null
  cars: {
    make: string
    model: string
    year: number
  }[]
  reviews: {
    id: string
    rating: number
    comment: string | null
    customerName: string
    createdAt: Date
  }[]
  stats: {
    totalBookings: number
    completedServices: number
    pendingServices: number
    averageRating: number
  }
}

export async function getMechanicProfile() {
  const { userId } = await auth()

  if (!userId) {
    throw new Error("Unauthorized")
  }

  const mechanic = await prisma.mechanic.findUnique({
    where: { userId },
    include: {
      user: {
        include: {
         Vehicle: true 
        }
      },
      serviceRequests: {
        include: {
          review: {
            include: {
              client: true
            }
          }
        }
      },
    }
  })

  if (!mechanic) {
    throw new Error("Mechanic not found")
  }

  const completedServices = mechanic.serviceRequests.filter(s => s.status === ServiceStatus.COMPLETED)
  const reviews = mechanic.serviceRequests
    .map(sr => sr.review)
    .filter((review): review is NonNullable<typeof review> => review !== null)

  const stats = {
    totalBookings: mechanic.serviceRequests.length,
    completedServices: completedServices.length,
    pendingServices: mechanic.serviceRequests.filter(s => s.status === ServiceStatus.REQUESTED).length,
    averageRating: reviews.length > 0 
      ? reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length 
      : 0
  }

  return {
    id: mechanic.id,
    bannerImage: mechanic.bannerImage,
    cars: mechanic.user.Vehicle.map(car => ({
      make: car.make,
      model: car.model,
      year: car.year
    })),
    reviews: reviews.map(review => ({
      id: review.id,
      rating: review.rating,
      comment: review.comment,
      customerName: review.client.firstName + " " + review.client.lastName,
      createdAt: review.createdAt
    })),
    stats
  }
}
