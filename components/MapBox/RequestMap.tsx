"use client"

import { useEffect, useRef, useState, useMemo } from "react"
import mapboxgl from "mapbox-gl"
import "mapbox-gl/dist/mapbox-gl.css"
import { useRealtimeServiceRequest } from "@/hooks/useRealtimeServiceRequest"
import { ServiceStatus } from "@prisma/client"

interface Location {
  latitude: number
  longitude: number
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
        // Create a safe error object with default values
        const safeError = {
          code: error?.code || 0,
          message: error?.message || 'Unknown error',
          toString: () => JSON.stringify({
            code: error?.code,
            message: error?.message
          })
        };
        
        try {
          console.error("Error getting location:", safeError.toString());
        } catch (e) {
          console.error("Error while handling location error:", e);
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 30000,
        maximumAge: 10000
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
  const mapInitialized = useRef(false)
  const [mapReady, setMapReady] = useState(false)
  const { activeRequest, isLoading, error } = useRealtimeServiceRequest()
  const [userCords, setUserCords] = useState<Location | null>(null)

  // Log any errors or state changes
  useEffect(() => {
    if (error) {
      console.error("RequestMap error:", error);
    }
    
    // Only log when data actually changes
    if (!isLoading) {
      console.log("RequestMap state:", { 
        hasActiveRequest: !!activeRequest,
        activeRequestId: activeRequest?.id,
        activeRequestStatus: activeRequest?.status,
        hasMechanicLocation: !!activeRequest?.mechanicLocation
      });
    }
  }, [activeRequest?.id, activeRequest?.status, isLoading, error]);

  // Initialize user location
  useEffect(() => {
    getUserLocation(setUserCords)
    
    // Clean up function
    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
      if (userMarkerRef.current) {
        userMarkerRef.current.remove()
        userMarkerRef.current = null
      }
      if (mechanicMarkerRef.current) {
        mechanicMarkerRef.current.remove()
        mechanicMarkerRef.current = null
      }
    }
  }, [])

  // Memoize the locations to prevent unnecessary updates
  const userLngLat = useMemo(() => {
    return toMapboxLngLat(userCords)
  }, [userCords])
  
  const mechanicLngLat = useMemo(() => {
    if (!activeRequest?.mechanicLocation) return null
    
    const mechLoc = activeRequest.mechanicLocation
    if (mechLoc?.longitude === undefined || mechLoc?.latitude === undefined) return null
    
    return toMapboxLngLat({ 
      longitude: mechLoc.longitude, 
      latitude: mechLoc.latitude 
    })
  }, [activeRequest?.mechanicLocation])

  // Initialize map only once
  useEffect(() => {
    if (!mapContainerRef.current || !userLngLat || mapInitialized.current) return

    try {
      if (!process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN) {
        console.error("Mapbox access token is missing")
        return
      }
      
      mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN

      const map = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: "mapbox://styles/mapbox/streets-v12",
        center: userLngLat,
        zoom: 15,
        attributionControl: false
      })

      map.on("load", () => {
        mapRef.current = map
        mapInitialized.current = true
        setMapReady(true)
      })
    } catch (error) {
      console.error("Error initializing map:", error)
    }
  }, [userLngLat]) // Only initialize once with user location

  // Handle user marker separately
  useEffect(() => {
    if (!mapRef.current || !userLngLat || !mapReady) return

    try {
      if (!userMarkerRef.current) {
        userMarkerRef.current = new mapboxgl.Marker({ color: "#4B5563" })
          .setPopup(new mapboxgl.Popup().setHTML("<p class='font-medium'>Your Location</p>"))
          .setLngLat(userLngLat)
          .addTo(mapRef.current)
      } else {
        userMarkerRef.current.setLngLat(userLngLat)
      }
    } catch (error) {
      console.error("Error updating user marker:", error)
    }
  }, [userLngLat, mapReady])

  // Handle mechanic marker separately
  useEffect(() => {
    if (!mapRef.current || !mapReady) return
    
    try {
      // Remove mechanic marker if conditions aren't met
      if (!activeRequest || 
          activeRequest.status !== ServiceStatus.IN_ROUTE || 
          !mechanicLngLat) {
        if (mechanicMarkerRef.current) {
          mechanicMarkerRef.current.remove()
          mechanicMarkerRef.current = null
        }
        return
      }

      // Add or update mechanic marker
      if (!mechanicMarkerRef.current) {
        mechanicMarkerRef.current = new mapboxgl.Marker({ color: "#10B981" })
          .setPopup(new mapboxgl.Popup().setHTML("<p class='font-medium'>Mechanic Location</p>"))
          .setLngLat(mechanicLngLat)
          .addTo(mapRef.current)
      } else {
        mechanicMarkerRef.current.setLngLat(mechanicLngLat)
      }

      // Fit bounds to show both markers
      if (userLngLat && mechanicLngLat) {
        const bounds = new mapboxgl.LngLatBounds()
        bounds.extend(mechanicLngLat)
        bounds.extend(userLngLat)
        mapRef.current.fitBounds(bounds, { padding: 100, duration: 1000 })
      }
    } catch (error) {
      console.error("Error updating mechanic marker:", error)
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