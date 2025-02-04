'use server'

import { prisma } from "@/lib/prisma"
import { ServiceStatus } from "@prisma/client"

export async function getServiceRequestsForClient(userId: string) {
  console.log('Fetching requests for user:', userId)
  
  const requests = await prisma.serviceRequest.findMany({
    where: {
      clientId: userId,
      NOT: [
        {status: ServiceStatus.COMPLETED}
      ]
      
    },
    orderBy: {
      createdAt: 'desc'
    }
  })
  console.log('Found requests:', requests)
  return requests
}