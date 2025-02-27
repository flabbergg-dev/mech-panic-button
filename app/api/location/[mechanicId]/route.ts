import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { ServiceRequest, ServiceStatus } from "@prisma/client"

interface Location {
  latitude: number
  longitude: number
}

interface ServiceRequestWithLocation extends Omit<ServiceRequest, 'mechanicLocation'> {
  mechanicLocation: Location | null
}

export async function GET(
  request: NextRequest,
  { params }: { params: { mechanicId: string } }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    // Set up headers for SSE
    const encoder = new TextEncoder()
    const customHeaders = {
      "Content-Type": "text/event-stream",
      Connection: "keep-alive",
      "Cache-Control": "no-cache",
    }

    const stream = new ReadableStream({
      async start(controller) {
        const sendLocation = async () => {
          try {
            const activeRequest = await prisma.serviceRequest.findFirst({
              where: {
                mechanicId: params.mechanicId,
                status: ServiceStatus.IN_ROUTE,
              },
              select: {
                id: true,
                status: true,
                mechanicLocation: true
              }
            }) as ServiceRequestWithLocation | null

            if (activeRequest?.mechanicLocation) {
              console.log('Mechanic location:', activeRequest.mechanicLocation)
              const location: Location = {
                latitude: activeRequest.mechanicLocation.latitude,
                longitude: activeRequest.mechanicLocation.longitude
              }
              
              console.log('Sending location:', location)
              controller.enqueue(encoder.encode(`data: ${JSON.stringify(location)}\n\n`))
            }
          } catch (error) {
            console.error("Error fetching mechanic location:", error)
            controller.error(error)
          }
        }

        // Initial location send
        await sendLocation()

        // Set up interval to send location updates
        const interval = setInterval(sendLocation, 5000)

        // Cleanup on close
        request.signal.addEventListener("abort", () => {
          clearInterval(interval)
          controller.close()
        })
      },
    })

    return new NextResponse(stream, { headers: customHeaders })
  } catch (error) {
    console.error("Error in location endpoint:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
