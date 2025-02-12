import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

type RouteParams = {
  requestId: string
}

export async function GET(
  request: Request,
  { params }: { params: Promise<RouteParams> }
) {
  try {
    const { userId } = await auth()
    const resolvedParams = await params
    
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    if (!resolvedParams.requestId) { 
      return new NextResponse("Invalid request ID", { status: 400 })
    }
    
    const serviceRequest = await prisma.serviceRequest.findUnique({
      where: {
        id: resolvedParams.requestId,
      },
      include: {
        client: true,
        offers: {
          include: {
            mechanic: {
              include: {
                user: true
              }
            }
          }
        }
      }
    })

    if (!serviceRequest) {
      return new NextResponse("Service request not found: ERR09", { status: 404 })
    }

    return NextResponse.json(serviceRequest)
  } catch (error) {
    console.error("[SERVICE_REQUEST_GET]", error)
    return new NextResponse("Internal error", { status: 500 })
  }
}