"use client"

import { useEffect, useRef, useState, useMemo } from "react"
import mapboxgl from "mapbox-gl"
import "mapbox-gl/dist/mapbox-gl.css"
import { useServiceRequest } from "@/hooks/useServiceRequest"
import { ServiceRequest, ServiceStatus } from "@prisma/client"

interface Location {
  latitude: number
  longitude: number
}

interface ServiceRequestWithLocation extends Omit<ServiceRequest, 'mechanicLocation'> {
  mechanicLocation: Location | null
}

const getUserLocation = (
  setUserCords: React.Dispatch<React.SetStateAction<Location | null>>
) => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserCords({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        })
      },
      (error) => {
        console.error("Error getting location: ", error)
      }
    )
  } else {
    console.error("Geolocation is not supported by this browser.")
  }
}

// Helper function to convert our Location type to Mapbox LngLat format
const toMapboxLngLat = (location: Location | null): [number, number] | null => {
  if (!location || typeof location.longitude !== 'number' || typeof location.latitude !== 'number') {
    return null
  }
  return [location.longitude, location.latitude]
}

const RequestMap = () => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const userMarkerRef = useRef<mapboxgl.Marker | null>(null)
  const mechanicMarkerRef = useRef<mapboxgl.Marker | null>(null)
  const [mapReady, setMapReady] = useState(false)
  const { activeRequest } = useServiceRequest() as { activeRequest: ServiceRequestWithLocation | null }
  const [userCords, setUserCords] = useState<Location | null>(null)

  // Initialize user location
  useEffect(() => {
    getUserLocation(setUserCords)
  }, [])

  // Memoize the locations to prevent unnecessary updates
  const userLngLat = useMemo(() => toMapboxLngLat(userCords), [userCords])
  const mechanicLngLat = useMemo(() => {
    const mechLoc = activeRequest?.mechanicLocation
    return mechLoc?.longitude !== undefined && mechLoc?.latitude !== undefined
      ? toMapboxLngLat({ longitude: mechLoc.longitude, latitude: mechLoc.latitude })
      : null
  }, [activeRequest?.mechanicLocation])

  // Initialize map only once
  useEffect(() => {
    if (!mapContainerRef.current || !userLngLat || mapRef.current) return

    try {
      mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN!

      const map = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: "mapbox://styles/mapbox/streets-v12",
        center: userLngLat,
        zoom: 15,
      })

      map.on("load", () => {
        mapRef.current = map
        setMapReady(true)
      })

      return () => {
        map.remove()
        mapRef.current = null
        setMapReady(false)
      }
    } catch (error) {
      console.error("Error initializing map:", error)
    }
  }, [userLngLat]) // Only initialize once with user location

  // Handle user marker separately
  useEffect(() => {
    if (!mapRef.current || !userLngLat) return

    if (!userMarkerRef.current) {
      userMarkerRef.current = new mapboxgl.Marker({ color: "#4B5563" })
        .setPopup(new mapboxgl.Popup().setHTML("<p class='font-medium'>Your Location</p>"))
        .addTo(mapRef.current)
    }

    userMarkerRef.current.setLngLat(userLngLat)

    return () => {
      if (userMarkerRef.current) {
        userMarkerRef.current.remove()
        userMarkerRef.current = null
      }
    }
  }, [userLngLat])

  // Handle mechanic marker separately
  useEffect(() => {
    if (!mapRef.current || !mapReady || !activeRequest || activeRequest.status !== ServiceStatus.IN_ROUTE || !mechanicLngLat) {
      if (mechanicMarkerRef.current) {
        mechanicMarkerRef.current.remove()
        mechanicMarkerRef.current = null
      }
      return
    }

    if (!mechanicMarkerRef.current) {
      mechanicMarkerRef.current = new mapboxgl.Marker({ color: "#10B981" })
        .setPopup(new mapboxgl.Popup().setHTML("<p class='font-medium'>Mechanic Location</p>"))
        .addTo(mapRef.current)
    }

    mechanicMarkerRef.current.setLngLat(mechanicLngLat)

    // Fit bounds to show both markers
    if (userLngLat) {
      const bounds = new mapboxgl.LngLatBounds()
      bounds.extend(mechanicLngLat)
      bounds.extend(userLngLat)
      mapRef.current.fitBounds(bounds, { padding: 100, duration: 1000 })
    }

    return () => {
      if (mechanicMarkerRef.current) {
        mechanicMarkerRef.current.remove()
        mechanicMarkerRef.current = null
      }
    }
  }, [mapReady, mechanicLngLat, activeRequest, userLngLat])

  return (
    <div 
      ref={mapContainerRef} 
      className="w-full h-full"
    />
  )
}

export default RequestMap