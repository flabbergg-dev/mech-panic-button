'use server'

import { prisma } from "@/lib/prisma"

export async function createReviewAction(
  serviceRequestId: string,
  clientId: string,
  rating: number,
  comment?: string
) {
  try {
    // Check if a review already exists for this service request
    const existingReview = await prisma.review.findUnique({
      where: {
        serviceRequestId
      }
    })

    if (existingReview) {
      return { 
        success: false, 
        error: 'A review already exists for this service request' 
      }
    }

    // Create the review
    const review = await prisma.review.create({
      data: {
        serviceRequestId,
        clientId,
        rating,
        comment
      }
    })

    // Update the mechanic's rating
    const serviceRequest = await prisma.serviceRequest.findUnique({
      where: { id: serviceRequestId },
      select: { mechanicId: true }
    })

    if (serviceRequest?.mechanicId) {
      // Get all reviews for this mechanic
      const mechanicReviews = await prisma.review.findMany({
        where: {
          serviceRequest: {
            mechanicId: serviceRequest.mechanicId
          }
        },
        select: { rating: true }
      })

      // Calculate new average rating
      const totalRating = mechanicReviews.reduce((sum, review) => sum + review.rating, 0)
      const averageRating = totalRating / mechanicReviews.length

      // Update mechanic's rating
      await prisma.mechanic.update({
        where: { id: serviceRequest.mechanicId },
        data: { rating: averageRating }
      })
    }

    return { success: true, review }
  } catch (error) {
    console.error('Error creating review:', error)
    return { 
      success: false, 
      error: 'Failed to create review' 
    }
  }
}
