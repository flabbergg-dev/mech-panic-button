'use server'

import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    // Get all service requests for this user
    const requests = await prisma.serviceRequest.findMany({
      where: {
        clientId: userId
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Get all offers for this user's requests
    const offers = await prisma.serviceOffer.findMany({
      where: {
        serviceRequestId: {
          in: requests.map(req => req.id)
        }
      },
      include: {
        mechanic: {
          select: {
            id: true,
            user: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          }
        }
      }
    })

    
    // Return detailed information about each request
    const detailedRequests = requests.map(req => ({
      id: req.id,
      status: req.status,
      createdAt: req.createdAt,
      updatedAt: req.updatedAt,
      mechanicId: req.mechanicId,
      hasMechanicLocation: !!req.mechanicLocation,
      clientId: req.clientId,
      offers: offers.filter(offer => offer.serviceRequestId === req.id)
    }))

    return NextResponse.json({
      userId,
      requestCount: requests.length,
      offerCount: offers.length,
      requests: detailedRequests
    })
  } catch (error) {
    console.error('Error in debug service requests:', error)
    return new NextResponse(`Internal Server Error: ${error instanceof Error ? error.message : 'Unknown error'}`, { status: 500 })
  }
}
