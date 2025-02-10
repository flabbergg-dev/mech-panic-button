"use server"
import { ServiceRequestDetails } from "@/components/service/ServiceRequestDetails"
import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"

type PageParams = {
  userId: string
  id: string
}

export default async function ServiceRequestPage({
  params,
}: {
  params: Promise<PageParams>
}) {
  const { userId, id: requestId } = await params

  const mechanic = await prisma.mechanic.findUnique({
    where: { userId },
    select: { id: true }
  })

  if (!mechanic) {
    notFound()
  }

  return (
    <div>
      <ServiceRequestDetails mechanicId={mechanic.id} requestId={requestId} />
    </div>
  )
}
