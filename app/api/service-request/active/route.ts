import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@clerk/nextjs/server'

export async function GET() {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    
    // First check if there are any service requests for this user
    const allRequests = await prisma.serviceRequest.findMany({
      where: {
        clientId: userId,
      },
      select: {
        id: true,
        status: true,
        extraService: true
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });
    
    // Then find the active request
    const request = await prisma.serviceRequest.findFirst({
      where: {
        clientId: userId,
        status: {
          in: [
            "REQUESTED",
            "ACCEPTED",
            "PAYMENT_AUTHORIZED",
            "IN_ROUTE",
            "SERVICING",
            "IN_COMPLETION"
          ]
        }
      },
      select: {
        id: true,
        status: true,
        mechanicId: true,
        clientId: true,
        completionCode: true,
        mechanicLocation: true,
        createdAt: true,
        updatedAt: true,
        firstTransactionId: true,
        mechanic: {
          select: {
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
        updatedAt: 'desc'
      }
    })

    return NextResponse.json(request || null)
  } catch (error) {
    console.error('Error fetching service request:', error)
    return new NextResponse(`Internal Server Error: ${error instanceof Error ? error.message : 'Unknown error'}`, { status: 500 })
  }
}
