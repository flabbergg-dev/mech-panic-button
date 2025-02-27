import { prisma } from "@/lib/prisma"
import { ServiceRequest } from "@prisma/client"

export type EnrichedServiceRequest = ServiceRequest & {
  mechanic?: {
    id: string
    user: {
      id: string
      firstName: string
      lastName: string
      stripeCustomerId: string | null
    } | null
    rating: number | null
  } | null
}

export async function getServiceRequestAction(userId: string): Promise<EnrichedServiceRequest | null> {
  try {
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
      include: {
        mechanic: {
          include: {
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
        createdAt: 'desc'
      }
    })

    return request
  } catch (error) {
    console.error('Error fetching service request:', error)
    return null
  }
}
