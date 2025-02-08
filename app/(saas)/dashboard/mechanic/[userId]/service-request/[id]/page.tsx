"use client"

import { useParams } from "next/navigation"
import { ServiceRequestDetails } from "@/components/service/ServiceRequestDetails"

export default function ServiceRequestPage() {
  const params = useParams()
  const userId = params.userId as string
  const requestId = params.id as string

  return (
    <ServiceRequestDetails 
      userId={userId}
      requestId={requestId}
    />
  )
}
