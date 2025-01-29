'use server'

import { prisma } from "@/lib/prisma"

export async function getServiceRequestsForClient(userId: string) {
  console.log('Fetching requests for user:', userId)
  
  const requests = await prisma.serviceRequest.findMany({
    where: {
      clientId: userId,
      OR: [
        { status: "REQUESTED" },
        { status: "OFFERED" }
      ]
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

  console.log('Found requests:', requests)

  // For offered requests, fetch mechanic details separately
  const offeredRequests = requests.filter(req => req.status === 'OFFERED')
  console.log('Offered requests before mechanic details:', offeredRequests)

  const mechanicDetails = await Promise.all(
    offeredRequests.map(async (request) => {
      if (!request.mechanicId) return { requestId: request.id, mechanic: null }
      
      const mechanic = await prisma.mechanic.findUnique({
        where: { id: request.mechanicId },
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true
            }
          }
        }
      })
      return {
        requestId: request.id,
        mechanic
      }
    })
  )

  console.log('Mechanic details:', mechanicDetails)

  // Combine the mechanic details with the requests
  const enrichedRequests = requests.map(request => {
    const mechanicDetail = mechanicDetails.find(md => md.requestId === request.id)
    return {
      ...request,
      mechanic: mechanicDetail?.mechanic || null
    }
  })

  console.log('Enriched requests:', enrichedRequests)
  return enrichedRequests
}

// Type for the enriched service request
export type EnrichedServiceRequest = Awaited<ReturnType<typeof getServiceRequestsForClient>>[number]
