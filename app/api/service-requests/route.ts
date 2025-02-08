import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { ServiceStatus } from '@prisma/client'
import { prisma } from '@/lib/prisma'


export async function GET(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status: ServiceStatus | null = searchParams.get('status') as ServiceStatus | null

    if (!status || !Object.values(ServiceStatus).includes(status)) {
      return new NextResponse("Invalid status parameter", { status: 400 })
    }
    
    
    const serviceRequests = await prisma.serviceRequest.findMany({
      where: {
        status: status,
        // Add any other filters as needed
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(serviceRequests)
  } catch (error) {
    console.error('[SERVICE_REQUESTS_GET]', error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
