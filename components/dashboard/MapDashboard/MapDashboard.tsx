"use client"

import { useEffect, useState } from "react"
import { ServiceRequestMap } from "@/components/MapBox/ServiceRequestMap"
import { useUser } from "@clerk/nextjs"
import { ServiceRequest } from "@prisma/client"
import { useServiceRequestStore } from "@/store/serviceRequestStore"

interface Location {
  latitude: number
  longitude: number
}

interface MapDashboardProps {
  serviceRequest: ServiceRequest
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
          console.error("Error getting location:", error)
        }
      )
    }

    // Subscribe to mechanic's location updates through your real-time service
    // This is just a placeholder - implement your actual real-time subscription
    const unsubscribe = subscribeToMechanicLocation(serviceRequest.mechanicId as string, (location) => {
      setMechanicLocation(location)
    })

    return () => {
      unsubscribe()
    }
  }, [serviceRequest.mechanicId])

  // Show loading state if locations aren't ready
  if (!customerLocation || !mechanicLocation || !user) {
    return <div className="flex items-center justify-center h-[80vh]">Loading map...</div>
  }

  // Only show the map to the customer who made the request
  if (serviceRequest.clientId === user.id) {
    return (
      <ServiceRequestMap
        serviceRequest={serviceRequest}
        customerLocation={customerLocation}
        mechanicLocation={mechanicLocation}
        showMechanicLocation={serviceStatus !== "PAYMENT_PENDING"}
      />
    )
  }

  return null
}

// Placeholder function - implement your actual real-time subscription logic
function subscribeToMechanicLocation(mechanicId: string, callback: (location: Location) => void) {
  // Implement your real-time subscription logic here
  // This could be using WebSocket, Server-Sent Events, or any other real-time solution
  return () => {
    // Cleanup subscription
  }
}
