import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { TestServiceOfferView } from "@/components/TestComponents/TestServiceOfferView"

export default async function TestOffersPage() {
  const { userId } = await auth()

  if (!userId) {
    redirect("/sign-in")
  }

  // Get all service requests for this user that have offers
  
  const serviceRequests = await prisma.serviceRequest.findMany({
    where: {
      clientId: userId,
      status: "OFFERED"
    },
    include: {
      offers: {
        include: {
          mechanic: {
            include: {
              user: true
            }
          }
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">View Service Offers</h1>
      <TestServiceOfferView serviceRequests={serviceRequests} />
    </div>
  )
}
