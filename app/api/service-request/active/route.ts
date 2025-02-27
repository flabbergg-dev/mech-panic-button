import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@clerk/nextjs/server'

export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    console.log('Fetching active request for user:', userId)
    const request = await prisma.serviceRequest.findFirst({
      where: {
        clientId: userId,
        OR: [
          { status: "REQUESTED" },
          { status: "ACCEPTED" },
          { status: "PAYMENT_AUTHORIZED" },
          { status: "IN_ROUTE" },
          { status: "SERVICING" },
          { status: "IN_COMPLETION" }
        ]
      },
      select: {
        id: true,
        status: true,
        mechanicId: true,
        mechanicLocation: true,
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

    console.log('Found request:', {
      id: request?.id,
      status: request?.status,
      mechanicId: request?.mechanicId,
      location: request?.mechanicLocation
    })

    return NextResponse.json(request)
  } catch (error) {
    console.error('Error fetching service request:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
