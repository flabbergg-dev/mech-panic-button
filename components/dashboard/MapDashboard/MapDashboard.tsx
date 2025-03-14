"use client"

import { useEffect, useState } from "react"
import { useUser } from "@clerk/nextjs"
import { ServiceStatus } from "@prisma/client"
import { useServiceRequestStore } from "@/store/serviceRequestStore"
import ServiceRequestMap from "@/components/MapBox/ServiceRequestMap"
import { toast } from "sonner"
import { Loader } from "@/components/loader"

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
          toast('Please enable location services to see your location')
        }
      )
    }
  }, [setMechanicLocation])

  // Show loading state if locations aren't ready
  if (!customerLocation || !user) {
    return <Loader title="Loading map" />
  }

  if(!mechanicLocation){
    return <Loader title="Loading mechanic location" />
  }

    return (

      <ServiceRequestMap
        serviceRequest={serviceRequest}
        customerLocation={customerLocation}
        mechanicLocation={mechanicLocation}
        showMechanicLocation={serviceStatus !== ServiceStatus.PAYMENT_AUTHORIZED}
      />
    )
}