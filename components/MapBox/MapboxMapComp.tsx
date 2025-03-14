"use client"

import { useMemo, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { useUserRole } from "@/hooks/use-user-role"
import { FileText } from "lucide-react"
import mapboxgl from "mapbox-gl"

import { InTransitInstructions } from "./InTransitInstructions"

import "mapbox-gl/dist/mapbox-gl.css"
import Image from "next/image"
import {  usePathname } from "next/navigation"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Modal } from "@/components/Modal/Modal"

interface Mechanic {
  userId: string;
  user: {
    firstName: string;
    lastName: string;
  };
  rating?: number;
  bannerImage?: string;
  bio?: string;
  isAvailable?: boolean;
  servicesOffered?: string[];
}

interface User {
  id: string;
  firstName: string;
  lastName: string;
}

interface MapboxProps {
  userCords: { latitude: number; longitude: number }
  selectedMechanic?: Mechanic
  setSelectedMechanic?: React.Dispatch<React.SetStateAction<Mechanic | undefined>>
  selectedUser?: User
  setSelectedUser?: React.Dispatch<React.SetStateAction<User | undefined>>
  mechanics?: Mechanic[]
  mechanicMarkers?: {
    id: string
    currentLocation: { latitude: number; longitude: number }
  }[]
}

interface ExtendedMap extends mapboxgl.Map {
  getRoute?: (end: [number, number]) => Promise<void>;
}

export const MapboxMapComp = ({
  userCords,
  selectedMechanic,
  setSelectedMechanic,
  selectedUser,
  setSelectedUser,
  mechanics,
  mechanicMarkers,
}: MapboxProps) => {
  const { userRole } = useUserRole()
  const isStartDrive = usePathname().includes("start-drive")
  const isServiceRequest = usePathname().includes("service-request")
  const isInTransit = usePathname().includes("in-transit")
  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<ExtendedMap | null>(null)
  const markersRef = useRef<Map<string, mapboxgl.Marker>>(new Map())
  const [showDirections, setShowDirections] = useState(false)
  const [showMechanicDetails, setShowMechanicDetails] = useState(false)
  const [routeData, setRouteData] = useState({
    distance: '',
    duration: '',
    currentStep: '',
    nextStep: ''
  })

  // Validate required environment variable
  const mapboxAccess = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN
  if (!mapboxAccess) {
    throw new Error("Missing required environment variable: NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN")
  }

  useMemo(() => {
    // Set access token
    mapboxgl.accessToken = mapboxAccess

    // Initialize map if container exists and not already initialized
    if (mapContainerRef.current && !mapRef.current) {
      mapRef.current = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: "mapbox://styles/mapbox/streets-v12",
        center: [userCords.longitude, userCords.latitude],
        zoom: 15,
      }) as ExtendedMap

      // Route calculation function with debouncing
      const getRoute = async (end: [number, number]) => {
        try {
          const query = await fetch(
            `https://api.mapbox.com/directions/v5/mapbox/driving/${userCords.longitude},${userCords.latitude};${end[0]},${end[1]}?steps=true&geometries=geojson&access_token=${mapboxAccess}`,
            { method: "GET" }
          )
          const json = await query.json()
          
          if (!json.routes?.[0]) {
            console.error('No route found')
            return
          }

          const data = json.routes[0]
          const route = data.geometry.coordinates
          
          // Update route data with minimal state changes
          setRouteData(prev => {
            const newDistance = `${Math.round(data.distance / 1000)} km`
            const newDuration = `${Math.round(data.duration / 60)} min`
            const newCurrentStep = data.legs[0]?.steps[0]?.maneuver?.instruction || ''
            const newNextStep = data.legs[0]?.steps[1]?.maneuver?.instruction || ''

            // Only update if values have changed
            if (
              prev.distance === newDistance &&
              prev.duration === newDuration &&
              prev.currentStep === newCurrentStep &&
              prev.nextStep === newNextStep
            ) {
              return prev
            }

            return {
              distance: newDistance,
              duration: newDuration,
              currentStep: newCurrentStep,
              nextStep: newNextStep
            }
          })

          // Add route to map
          const geojson: GeoJSON.Feature<GeoJSON.LineString> = {
            type: 'Feature' as const,
            properties: {},
            geometry: {
              type: 'LineString' as const,
              coordinates: route
            }
          }

          if (mapRef.current?.getSource('route')) {
            (mapRef.current.getSource('route') as mapboxgl.GeoJSONSource).setData(geojson)
          } else if (mapRef.current) {
            mapRef.current.addLayer({
              id: 'route',
              type: 'line',
              source: {
                type: 'geojson',
                data: geojson
              },
              layout: {
                'line-join': 'round',
                'line-cap': 'round'
              },
              paint: {
                'line-color': '#3887be',
                'line-width': 5,
                'line-opacity': 0.75
              }
            })
          }
        } catch (error) {
          console.error('Error calculating route:', error)
        }
      }

      // Add mechanic markers
      for (const mechanicMarker of (mechanicMarkers ?? [])) {
        if (mechanicMarker) {
          const marker = new mapboxgl.Marker()
            .setLngLat([
              mechanicMarker.currentLocation.longitude,
              mechanicMarker.currentLocation.latitude,
            ])
            .addTo(mapRef.current)

          markersRef.current.set(mechanicMarker.id, marker)

          marker.getElement().addEventListener("click", () => {
            const selectedMechanicUserInfo = mechanics?.find(
              (mechanic) => mechanic.userId === mechanicMarker.id
            )
            if (selectedMechanicUserInfo && setSelectedMechanic) {
              setSelectedMechanic(selectedMechanicUserInfo)
              setShowMechanicDetails(true)
            }
          })
        }
      }

      // Add user marker
      new mapboxgl.Marker({ color: '#FF0000' })
        .setLngLat([userCords.longitude, userCords.latitude])
        .addTo(mapRef.current)

      // Store getRoute function
      mapRef.current.getRoute = getRoute
    }

    // Update map center when coordinates change
    if (mapRef.current) {
      mapRef.current.setCenter([userCords.longitude, userCords.latitude])
    }

    // Cleanup function
    return () => {
      if (mapRef.current) {
        // Remove all markers
        for (const marker of Array.from(markersRef.current.values())) {
          marker.remove()
        }
        markersRef.current.clear()
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [mapboxAccess, userCords.longitude, userCords.latitude, mechanicMarkers, mechanics, setSelectedMechanic])

  return (
    <>
      <div
        id="map-container"
        style={{
          height: "100svh",
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,

          zIndex: 0,
        }}
        ref={mapContainerRef}
      />

      <Modal
        dialogText="Mechanic Information"
        buttonText=""
        isOpen={showMechanicDetails}
      >
        {selectedMechanic && (
          <Card className="flex flex-col items-center">
            <CardHeader className="border w-full">
              <Image
                src={selectedMechanic.bannerImage || "/images/mechanic.jpg"}
                alt="Mechanic Banner"
                width={400}
                height={200}
                className="w-full h-48 object-cover"
              />
            </CardHeader>
            <CardContent>
              <p className="text-lg font-bold mt-4">
                {selectedMechanic.isAvailable ? "Available" : "Not Available"}
              </p>
              <p className="">Bio: {selectedMechanic.bio}</p>
              <p className="">Rating: {selectedMechanic.rating}</p>
              {selectedMechanic.servicesOffered && (
                <ul>
                  {selectedMechanic.servicesOffered.map((service: string) => (
                    <li key={service} className="text-center">
                      {service}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        )}
        <div className="pt-4 flex justify-end">
          <Button onClick={() => setShowMechanicDetails(false)}>Close</Button>
        </div>
      </Modal>

      {userRole === "Mechanic" && (
        <>
          {isInTransit && (
            <Button
              className="fixed top-4 right-4 z-10"
              onClick={() => setShowDirections(!showDirections)}
            >
              <FileText className="h-4 w-4 mr-2" />
              {showDirections ? "Hide Directions" : "Show Directions"}
            </Button>
          )}

          <div
            id="instructions"
            className={`bg-white  overflow-y-hidden transition-all duration-300 max-h-[40svh] w-full ${
              showDirections
                ? "translate-x-0 opacity-100"
                : "translate-x-full opacity-0"
            }`}
            style={{
              height: "100svh",
              width: "100%",
              zIndex: 45,
              boxShadow: "-2px 0 10px rgba(0,0,0,0.1)",
            }}
          />

          {isInTransit && (
            <InTransitInstructions
              duration={Number(routeData.duration.split(' ')[0])}
              currentStep={routeData.currentStep}
              nextStep={routeData.nextStep}
            />
          )}
        </>
      )}
    </>
  )
}
