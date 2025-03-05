"use client"

import { useEffect, useState } from "react"
import { useUser } from "@clerk/nextjs"
import { ServiceRequest, ServiceStatus } from "@prisma/client"
import { useServiceRequestStore } from "@/store/serviceRequestStore"
import { toast } from "@/hooks/use-toast"
import ServiceRequestMap from "@/components/MapBox/ServiceRequestMap"

interface Location {
  latitude: number
  longitude: number
}

interface MapDashboardProps {
  serviceRequest: {
    id: string
    status: ServiceStatus
    mechanicId?: string
  }
}

export const MapDashboard = ({ serviceRequest }: MapDashboardProps) => {
  const { user } = useUser()
  const [customerLocation, setCustomerLocation] = useState<Location | null>(null)
  const { mechanicLocation, setMechanicLocation, serviceStatus } = useServiceRequestStore()

  useEffect(() => {
    // Get customer's current location
    if (navigator.geolocation) {
      navigator.geolocation.watchPosition(
        (position) => {
          setCustomerLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          })
        },
        (error) => {
          setCustomerLocation({
            latitude: 37.7749,
            longitude: -122.4194,
          });
          setMechanicLocation({
            latitude: 37.7749,
            longitude: -122.4194,
          });
          toast({
            title: "Error getting location",
            description: "Please enable location services to see your location",
          })
          // console.error("Error getting location:", error)
        }
      )
    }
  }, [])

  console.log('customerLocation', customerLocation)
  console.log('mechanicLocation', mechanicLocation)

  // Show loading state if locations aren't ready
  if (!customerLocation || !user) {
    return <div className="flex items-center justify-center h-[80vh]">Loading map...</div>
  }

    return (
      <ServiceRequestMap
        serviceRequest={serviceRequest}
        customerLocation={customerLocation}
        mechanicLocation={mechanicLocation!}
        showMechanicLocation={serviceStatus !== ServiceStatus.PAYMENT_AUTHORIZED}
      />
    )
}