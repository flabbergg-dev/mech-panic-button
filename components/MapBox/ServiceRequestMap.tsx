"use client"

import { useState } from "react"
import { ServiceRequest } from "@prisma/client"
import { Card } from "@/components/ui/card"
import { Navigation, MapPin } from "lucide-react"
import { Map } from "./Map"

interface Location {
  latitude: number
  longitude: number
}

interface ServiceRequestMapProps {
  serviceRequest: ServiceRequest
  customerLocation: Location
  mechanicLocation?: Location
  showMechanicLocation?: boolean
  showRoute?: boolean
  onRouteCalculated?: (duration: number) => void
}

export const ServiceRequestMap = ({
  serviceRequest,
  customerLocation,
  mechanicLocation,
  showMechanicLocation = false,
  showRoute = false,
  onRouteCalculated,
}: ServiceRequestMapProps) => {
  const [status, setStatus] = useState(serviceRequest.status)
  const [estimatedTime, setEstimatedTime] = useState<number | null>(null)

  const markers = [
    {
      location: customerLocation,
      color: "#2563eb",
      popupText: "<h3>Customer Location</h3>"
    },
    ...(showMechanicLocation && mechanicLocation ? [{
      location: mechanicLocation,
      color: "#059669",
      popupText: "<h3>Mechanic Location</h3>"
    }] : [])
  ]

  const handleRouteCalculated = (duration: number) => {
    setEstimatedTime(duration)
    onRouteCalculated?.(duration)
  }

  return (
    <div className="relative w-full h-[calc(100vh-4rem)]">
      <Map
        center={customerLocation}
        markers={markers}
        showRoute={showRoute}
        onRouteCalculated={onRouteCalculated}
      />
      
      {/* Status Card */}
      <Card className="absolute bottom-4 left-4 right-4 p-4 bg-white/90 backdrop-blur">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {status === "ACCEPTED" && (
                <span className="text-yellow-500">Payment Pending</span>
              )}
              {status === "PAYMENT_AUTHORIZED" && (
                <span className="text-blue-500">Waiting for mechanic...</span>
              )}
              {status === "IN_ROUTE" && (
                <div className="flex items-center gap-2">
                  <Navigation className="text-green-600 animate-pulse" />
                  <span className="text-green-600">
                    Mechanic is on the way
                    {estimatedTime && ` - ETA: ${estimatedTime} minutes`}
                  </span>
                </div>
              )}
              {status === "IN_PROGRESS" && (
                <div className="flex items-center gap-2">
                  <MapPin className="text-green-600" />
                  <span className="text-green-600">Mechanic has arrived!</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}