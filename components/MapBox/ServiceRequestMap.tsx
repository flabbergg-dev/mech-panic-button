"use client"

import { useState, useEffect, lazy, Suspense } from "react"
import { Card } from "@/components/ui/card"
import { Navigation, MapPin } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { usePathname } from "next/navigation";
const Map = lazy(() => import("./Map"))

interface Location {
  longitude: number
  latitude: number
}

interface ServiceRequestMapProps {
  serviceRequest: any
  customerLocation: Location
  mechanicLocation?: Location
  showMechanicLocation?: boolean
  showRoute?: boolean
  onRouteCalculated?: (duration: number, distance: number) => void
}

export const ServiceRequestMap = ({
  serviceRequest,
  customerLocation,
  mechanicLocation,
  showMechanicLocation = true,
  showRoute = false,
  onRouteCalculated,
}: ServiceRequestMapProps) => {
  const [status, setStatus] = useState(serviceRequest.status)
  const pathname = usePathname();

  // Determine if user is mechanic based on URL
  const isMechanic = pathname?.includes('/dashboard/mechanic');

  // Update status when service request changes
  useEffect(() => {
    setStatus(serviceRequest.status);
  }, [serviceRequest.status]);

  // Get center location based on role
  const getCenterLocation = () => {
    if (isMechanic && mechanicLocation) {
      return mechanicLocation;
    }
    return customerLocation;
  };

  // Only show markers when we have valid locations
  const markers = [
    {
      location: customerLocation,
      color: "#2563eb", // blue
      popupText: "<h3>Customer Location</h3>"
    },
    ...(showMechanicLocation && mechanicLocation ? [{
      location: mechanicLocation,
      color: "#059669", // green
      popupText: "<h3>Your Location</h3>"
    }] : [])
  ].filter(marker => 
    marker.location && 
    !isNaN(marker.location.latitude) && 
    !isNaN(marker.location.longitude)
  );

  const handleRouteCalculated = (duration: number, steps: any[], totalDistance: number) => {
    onRouteCalculated?.(duration, totalDistance);
  }

  // Only show route if we have both locations and showRoute is true
  const shouldShowRoute = showRoute && 
    markers.length === 2 && 
    mechanicLocation && 
    !isNaN(mechanicLocation.latitude) && 
    !isNaN(mechanicLocation.longitude);

  return (
    <div className="relative w-full h-[calc(100vh-4rem)]">
      <Suspense fallback={<Skeleton className="w-full h-full" />}>
        <Map
          center={getCenterLocation()}
          markers={markers}
          showRoute={shouldShowRoute}
          onRouteCalculated={handleRouteCalculated}
        />
      </Suspense>
    </div>
  );
};