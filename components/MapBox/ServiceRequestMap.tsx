"use client"

import { useEffect, useState } from "react"
import mapboxgl from "mapbox-gl"
import "mapbox-gl/dist/mapbox-gl.css"
import { ServiceRequest } from "@prisma/client"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MapPin, Navigation } from "lucide-react"

// Define service request status types
type ServiceRequestStatus = 
  | "PAYMENT_PENDING"
  | "PAYMENT_PROCESSING"
  | "PAYMENT_COMPLETED"
  | "WAITING_MECHANIC"
  | "MECHANIC_EN_ROUTE"
  | "MECHANIC_ARRIVED"
  | "SERVICE_IN_PROGRESS"
  | "SERVICE_COMPLETED"

interface Location {
  latitude: number
  longitude: number
}

interface ServiceRequestMapProps {
  serviceRequest: ServiceRequest
  customerLocation: Location
  mechanicLocation: Location
  isMechanicLocationVisible: boolean
  isCustomerLocationVisible: boolean
}

export const ServiceRequestMap = ({
  serviceRequest,
  customerLocation,
  mechanicLocation,
  isMechanicLocationVisible,
  isCustomerLocationVisible,
}: ServiceRequestMapProps) => {
  const [map, setMap] = useState<mapboxgl.Map | null>(null)
  const [status, setStatus] = useState<ServiceRequestStatus>("PAYMENT_PENDING")
  const [estimatedTime, setEstimatedTime] = useState<number | null>(null)

  // Initialize map
  useEffect(() => {
    if (!map) {
      const newMap = new mapboxgl.Map({
        container: "map",
        style: "mapbox://styles/mapbox/streets-v12",
        center: [customerLocation.longitude, customerLocation.latitude],
        zoom: 13,
      })

      setMap(newMap)

      return () => {
        newMap.remove();
      };
    }
  }, [])

  // Update markers and route when locations change
  useEffect(() => {
    if (!map) return

    // Add customer marker if visible
    if (isCustomerLocationVisible) {
      const customerMarker = new mapboxgl.Marker({ color: "#2563eb" })
        .setLngLat([customerLocation.longitude, customerLocation.latitude])
        .setPopup(new mapboxgl.Popup().setHTML("<h3>Your Location</h3>"))
        .addTo(map)

      return () => {
        customerMarker.remove();
      };
    }

    // Add mechanic marker if visible
    if (isMechanicLocationVisible) {
      const mechanicMarker = new mapboxgl.Marker({ color: "#059669" })
        .setLngLat([mechanicLocation.longitude, mechanicLocation.latitude])
        .setPopup(new mapboxgl.Popup().setHTML("<h3>Mechanic Location</h3>"))
        .addTo(map)

      // Get route and estimated time if mechanic is en route
      if (status === "MECHANIC_EN_ROUTE") {
        fetchRouteAndTime()
      }

      return () => {
        mechanicMarker.remove();
      };
    }
  }, [map, customerLocation, mechanicLocation, isMechanicLocationVisible, isCustomerLocationVisible, status])

  const fetchRouteAndTime = async () => {
    try {
      const response = await fetch(
        `https://api.mapbox.com/directions/v5/mapbox/driving/` +
          `${mechanicLocation.longitude},${mechanicLocation.latitude};` +
          `${customerLocation.longitude},${customerLocation.latitude}` +
          `?access_token=${process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN}`
      );
      const data = await response.json()

      if (data.routes?.[0]) {
        const time = Math.round(data.routes[0].duration / 60) // Convert to minutes
        setEstimatedTime(time)

        // Draw the route on the map
        if (map && data.routes[0].geometry) {
          if (map.getSource('route')) {
            (map.getSource('route') as mapboxgl.GeoJSONSource).setData({
              type: 'Feature',
              properties: {},
              geometry: data.routes[0].geometry
            })
          } else {
            map.addSource('route', {
              type: 'geojson',
              data: {
                type: 'Feature',
                properties: {},
                geometry: data.routes[0].geometry
              }
            })

            map.addLayer({
              id: 'route',
              type: 'line',
              source: 'route',
              layout: {
                'line-join': 'round',
                'line-cap': 'round'
              },
              paint: {
                'line-color': '#059669',
                'line-width': 4
              }
            })
          }
        }
      }
    } catch (error) {
      console.error('Error fetching route:', error)
    }
  }

  return (
    <div className="relative w-full h-[calc(100vh-4rem)]">
      <div id="map" className="w-full h-full" />
      
      {/* Status Card */}
      <Card className="absolute bottom-4 left-4 right-4 p-4 bg-white/90 backdrop-blur">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {status === "PAYMENT_PENDING" && (
                <>
                  <span className="text-yellow-500">Payment Pending</span>
                  <Button variant="default">Complete Payment</Button>
                </>
              )}
              {status === "WAITING_MECHANIC" && (
                <span className="text-blue-500">Waiting for mechanic to start...</span>
              )}
              {status === "MECHANIC_EN_ROUTE" && (
                <div className="flex items-center gap-2">
                  <Navigation className="text-green-600 animate-pulse" />
                  <span className="text-green-600">
                    Mechanic is on the way
                    {estimatedTime && ` - ETA: ${estimatedTime} minutes`}
                  </span>
                </div>
              )}
              {status === "MECHANIC_ARRIVED" && (
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
  )
}