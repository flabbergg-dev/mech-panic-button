'use server'

import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { userId } = await auth()
    console.log('Fetching service request details:', id, 'for user:', userId)
    
    if (!userId) {
      console.log('Unauthorized: No userId found')
      return new NextResponse('Unauthorized', { status: 401 })
    }

    if (!id) {
      return new NextResponse('Service request ID is required', { status: 400 })
    }

    const serviceRequest = await prisma.serviceRequest.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        status: true,
        mechanicId: true,
        mechanicLocation: true,
        createdAt: true,
        updatedAt: true,
        clientId: true,
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
      }
    })

    if (!serviceRequest) {
      return new NextResponse('Service request not found', { status: 404 })
    }

    // Verify that the user is authorized to view this service request
    if (serviceRequest.clientId !== userId) {
      // Check if the user is the mechanic for this request
      const isMechanic = serviceRequest.mechanic?.user?.id === userId
      
      if (!isMechanic) {
        return new NextResponse('Unauthorized to view this service request', { status: 403 })
      }
    }

    console.log('Found service request:', {
      id: serviceRequest.id,
      status: serviceRequest.status,
      mechanicId: serviceRequest.mechanicId,
      clientId: serviceRequest.clientId
    })

    return NextResponse.json(serviceRequest)
  } catch (error) {
    console.error('Error fetching service request details:', error)
    return new NextResponse(`Internal Server Error: ${error instanceof Error ? error.message : 'Unknown error'}`, { status: 500 })
  }
}
