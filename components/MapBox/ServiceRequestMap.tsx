"use client"

import { useEffect, useRef, useCallback, useState, useMemo, memo } from "react"
import mapboxgl from "mapbox-gl"
import "mapbox-gl/dist/mapbox-gl.css"
import { ServiceRequest, ServiceStatus } from "@prisma/client"

interface ServiceRequestMapProps {
  serviceRequest: ServiceRequest
  customerLocation: { latitude: number; longitude: number }
  mechanicLocation?: { latitude: number; longitude: number }
  showMechanicLocation?: boolean
  showRoute?: boolean
  onRouteCalculated?: (duration: number, distance: number) => void
}

// Helper function to convert location to Mapbox LngLat format
const toMapboxLngLat = (location: { latitude: number; longitude: number } | undefined): [number, number] | null => {
  if (!location || typeof location.longitude !== 'number' || typeof location.latitude !== 'number') {
    return null
  }
  return [location.longitude, location.latitude]
}

// Helper functions for localStorage
const STORAGE_KEYS = {
  MECHANIC_LOCATION: (requestId: string) => `mechanic_location_${requestId}`,
  CUSTOMER_LOCATION: (requestId: string) => `customer_location_${requestId}`
}

type LocationType = { latitude: number; longitude: number }

const getStoredLocation = (key: string): LocationType | undefined => {
  try {
    const stored = localStorage.getItem(key)
    const parsed = stored ? JSON.parse(stored) : null
    return parsed || undefined
  } catch (error) {
    console.error("Error reading from localStorage:", error)
    return undefined
  }
}

const setStoredLocation = (key: string, location: LocationType | undefined | null) => {
  try {
    if (location) {
      localStorage.setItem(key, JSON.stringify(location))
    } else {
      localStorage.removeItem(key)
    }
  } catch (error) {
    console.error("Error writing to localStorage:", error)
  }
}

const ServiceRequestMap = ({
  serviceRequest,
  customerLocation,
  mechanicLocation,
  showMechanicLocation = false,
  showRoute = false,
  onRouteCalculated,
}: ServiceRequestMapProps) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const customerMarkerRef = useRef<mapboxgl.Marker | null>(null)
  const mechanicMarkerRef = useRef<mapboxgl.Marker | null>(null)
  const routeRef = useRef<mapboxgl.GeoJSONSource | null>(null)
  const [mapReady, setMapReady] = useState(false)
  const previousMechanicLocation = useRef(mechanicLocation)
  const routeUpdateTimeoutRef = useRef<NodeJS.Timeout>()

  // Store locations in state with localStorage backup
  const [storedCustomerLocation, setStoredCustomerLocation] = useState<LocationType | undefined>(undefined)
  const [storedMechanicLocation, setStoredMechanicLocation] = useState<LocationType | undefined>(undefined)

  // Initialize stored locations only once when component mounts
  useEffect(() => {
    const customerKey = STORAGE_KEYS.CUSTOMER_LOCATION(serviceRequest.id)
    const mechanicKey = STORAGE_KEYS.MECHANIC_LOCATION(serviceRequest.id)

    const storedCustomer = getStoredLocation(customerKey)
    const storedMechanic = getStoredLocation(mechanicKey)

    if (storedCustomer) setStoredCustomerLocation(storedCustomer)
    if (storedMechanic) setStoredMechanicLocation(storedMechanic)
  }, [serviceRequest.id])

  // Update stored locations when they change, with debounce
  useEffect(() => {
    const customerKey = STORAGE_KEYS.CUSTOMER_LOCATION(serviceRequest.id)
    const mechanicKey = STORAGE_KEYS.MECHANIC_LOCATION(serviceRequest.id)

    const updateTimeout = setTimeout(() => {
      if (customerLocation) {
        setStoredLocation(customerKey, customerLocation)
        setStoredCustomerLocation(customerLocation)
      }

      if (mechanicLocation) {
        setStoredLocation(mechanicKey, mechanicLocation)
        setStoredMechanicLocation(mechanicLocation)
      }

      // Clear mechanic location when service is completed
      if (serviceRequest.status === ServiceStatus.COMPLETED) {
        setStoredLocation(mechanicKey, undefined)
        setStoredMechanicLocation(undefined)
      }
    }, 1000) // Debounce for 1 second

    return () => clearTimeout(updateTimeout)
  }, [customerLocation, mechanicLocation, serviceRequest.status, serviceRequest.id])

  // Use stored locations or live locations with memoization
  const effectiveCustomerLocation = useMemo(() => 
    customerLocation || storedCustomerLocation, 
    [customerLocation, storedCustomerLocation]
  )
  
  const effectiveMechanicLocation = useMemo(() => 
    mechanicLocation || storedMechanicLocation, 
    [mechanicLocation, storedMechanicLocation]
  )

  // Memoize the locations to prevent unnecessary updates
  const customerLngLat = useMemo(() => toMapboxLngLat(effectiveCustomerLocation), [effectiveCustomerLocation])
  const mechanicLngLat = useMemo(() => toMapboxLngLat(effectiveMechanicLocation), [effectiveMechanicLocation])

  // Initialize map only once with proper cleanup
  useEffect(() => {
    if (!mapContainerRef.current || !customerLngLat || mapRef.current) return

    try {
      mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN!

      const map = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: "mapbox://styles/mapbox/streets-v12",
        center: customerLngLat,
        zoom: 15,
      })

      map.on("load", () => {
        map.addSource("route", {
          type: "geojson",
          data: {
            type: "Feature",
            properties: {},
            geometry: {
              type: "LineString",
              coordinates: [],
            },
          },
        })

        map.addLayer({
          id: "route",
          type: "line",
          source: "route",
          layout: {
            "line-join": "round",
            "line-cap": "round",
          },
          paint: {
            "line-color": "#10B981",
            "line-width": 4,
            "line-opacity": 0.75,
          },
        })

        routeRef.current = map.getSource("route") as mapboxgl.GeoJSONSource
        mapRef.current = map
        setMapReady(true)
      })

      return () => {
        map.remove()
        mapRef.current = null
        routeRef.current = null
        setMapReady(false)
      }
    } catch (error) {
      console.error("Error initializing map:", error)
    }
  }, [customerLngLat])

  // Handle customer marker separately
  useEffect(() => {
    if (!mapRef.current || !customerLngLat) return

    try {
      if (!customerMarkerRef.current) {
        const [lng, lat] = customerLngLat
        if (typeof lng !== 'number' || typeof lat !== 'number') return

        customerMarkerRef.current = new mapboxgl.Marker({ color: "#4B5563" })
          .setPopup(new mapboxgl.Popup().setHTML("<p class='font-medium'>Customer Location</p>"))
          .setLngLat([lng, lat])
          .addTo(mapRef.current)
      } else {
        const [lng, lat] = customerLngLat
        if (typeof lng !== 'number' || typeof lat !== 'number') return
        customerMarkerRef.current.setLngLat([lng, lat])
      }
    } catch (error) {
      console.error("Error setting customer marker:", error)
    }

    return () => {
      if (customerMarkerRef.current) {
        customerMarkerRef.current.remove()
        customerMarkerRef.current = null
      }
    }
  }, [customerLngLat])

  // Handle mechanic marker separately
  useEffect(() => {
    if (!mapRef.current || !mapReady || !showMechanicLocation) return

    try {
      const shouldShowMechanic = 
        serviceRequest.status === ServiceStatus.PAYMENT_AUTHORIZED ||
        serviceRequest.status === ServiceStatus.IN_ROUTE ||
        serviceRequest.status === ServiceStatus.SERVICING

      if (!shouldShowMechanic || !mechanicLngLat) {
        if (mechanicMarkerRef.current) {
          mechanicMarkerRef.current.remove()
          mechanicMarkerRef.current = null
        }
        return
      }

      const [lng, lat] = mechanicLngLat
      if (typeof lng !== 'number' || typeof lat !== 'number') return

      if (!mechanicMarkerRef.current) {
        mechanicMarkerRef.current = new mapboxgl.Marker({ color: "#10B981" })
          .setPopup(new mapboxgl.Popup().setHTML("<p class='font-medium'>Mechanic Location</p>"))
          .setLngLat([lng, lat])
          .addTo(mapRef.current)
      } else {
        mechanicMarkerRef.current.setLngLat([lng, lat])
      }
    } catch (error) {
      console.error("Error setting mechanic marker:", error)
    }

    return () => {
      if (mechanicMarkerRef.current) {
        mechanicMarkerRef.current.remove()
        mechanicMarkerRef.current = null
      }
    }
  }, [mapReady, mechanicLngLat, serviceRequest.status, showMechanicLocation])

  // Handle route updates with debouncing
  const getRoute = useCallback(async (
    mechLoc: { longitude: number; latitude: number },
    custLoc: { longitude: number; latitude: number }
  ) => {
    if (!routeRef.current) return

    try {
      // Clear any pending route updates
      if (routeUpdateTimeoutRef.current) {
        clearTimeout(routeUpdateTimeoutRef.current)
      }

      // Debounce route updates
      routeUpdateTimeoutRef.current = setTimeout(async () => {
        const query = await fetch(
          `https://api.mapbox.com/directions/v5/mapbox/driving/${mechLoc.longitude},${mechLoc.latitude};${custLoc.longitude},${custLoc.latitude}?steps=true&geometries=geojson&access_token=${process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN}`
        )
        const json = await query.json()

        if (json.routes?.[0]) {
          const route = json.routes[0]
          const { coordinates } = route.geometry

          routeRef.current?.setData({
            type: "Feature",
            properties: {},
            geometry: {
              type: "LineString",
              coordinates,
            },
          })

          if (onRouteCalculated) {
            onRouteCalculated(Math.round(route.duration / 60), route.distance)
          }
        }
      }, 1000) // Debounce for 1 second
    } catch (error) {
      console.error("Error fetching route:", error)
    }
  }, [onRouteCalculated])

  // Update route and map view based on status with optimization
  useEffect(() => {
    if (!mapRef.current || !mapReady || !effectiveMechanicLocation || !effectiveCustomerLocation) return

    const map = mapRef.current

    // Only update if mechanic location has changed significantly
    const hasLocationChanged = !previousMechanicLocation.current || 
      Math.abs(previousMechanicLocation.current.latitude - effectiveMechanicLocation.latitude) > 0.0001 ||
      Math.abs(previousMechanicLocation.current.longitude - effectiveMechanicLocation.longitude) > 0.0001

    if (!hasLocationChanged) return

    previousMechanicLocation.current = effectiveMechanicLocation

    const updateMap = () => {
      switch (serviceRequest.status) {
        case ServiceStatus.PAYMENT_AUTHORIZED:
          if (mechanicLngLat) {
            map.flyTo({
              center: mechanicLngLat,
              zoom: 15,
              duration: 1000
            })
          }
          break

        case ServiceStatus.IN_ROUTE:
        case ServiceStatus.SERVICING:
          if (showRoute && mechanicLngLat && customerLngLat) {
            getRoute(effectiveMechanicLocation, effectiveCustomerLocation)
            const bounds = new mapboxgl.LngLatBounds()
            bounds.extend(mechanicLngLat)
            bounds.extend(customerLngLat)
            map.fitBounds(bounds, { padding: 100, duration: 1000 })
          }
          break
      }
    }

    // Debounce map updates
    const timeoutId = setTimeout(updateMap, 300)
    return () => clearTimeout(timeoutId)
  }, [
    mapReady,
    serviceRequest.status,
    showRoute,
    effectiveMechanicLocation,
    effectiveCustomerLocation,
    mechanicLngLat,
    customerLngLat,
    getRoute
  ])

  return <div ref={mapContainerRef} className="w-full h-full" />
}

export default memo(ServiceRequestMap)