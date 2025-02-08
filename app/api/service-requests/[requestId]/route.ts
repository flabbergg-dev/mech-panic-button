import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: Request,
  { params }: { params: { requestId: string } }
) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    if (!params.requestId) { 
      return new NextResponse("Invalid request ID", { status: 400 })
    }
    
    const serviceRequest = await prisma.serviceRequest.findUnique({
      where: {
        id: params.requestId,
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
      return new NextResponse("Service request not found", { status: 404 })
    }

    return NextResponse.json(serviceRequest)
  } catch (error) {
    console.error("[SERVICE_REQUEST_GET]", error)
    return new NextResponse("Internal error", { status: 500 })
  }
}