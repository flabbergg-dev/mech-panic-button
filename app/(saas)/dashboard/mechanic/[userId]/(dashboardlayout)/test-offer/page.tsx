import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { TestServiceOffer } from "@/components/TestComponents/TestServiceOffer"

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
  const serviceRequests = await prisma.serviceRequest.findMany({
    where: {
      status: "REQUESTED"
    },
    include: {
      client: true
    },
    orderBy: {
      createdAt: 'desc'
    }
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
