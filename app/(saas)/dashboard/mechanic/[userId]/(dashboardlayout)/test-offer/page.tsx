import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { TestServiceOffer } from "@/components/TestComponents/TestServiceOffer"
import { ServiceStatus } from "@prisma/client"

export default async function TestOfferPage() {
  const { userId } = await auth()

  if (!userId) {
    redirect("/sign-in")
  }

  // Get mechanic info
  const mechanic = await prisma.mechanic.findFirst({
    where: { userId: userId },
    include: {
      user: true
    }
  })

  if (!mechanic) {
    return <div>No mechanic profile found</div>
  }

  // Get all service requests in REQUESTED status

  let serviceRequests = await prisma.serviceRequest.findMany({
    where: {
        status: ServiceStatus.REQUESTED

    },
    include: {
      client: true
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

  // Filter service requests to show only those that don't have an offer from the logged mechanic
  const serviceOffer = await prisma.serviceOffer.findMany({
    where: {
      mechanicId: mechanic.id,
    }
  })

  serviceRequests = serviceRequests.filter((request) => {
    return !serviceOffer.some((offer) => offer.serviceRequestId === request.id)
  })

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Test Service Offers</h1>
      <TestServiceOffer 
        mechanicId={mechanic.id}
        serviceRequests={serviceRequests}
      />
    </div>
  )
}
