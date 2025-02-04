// a mapbox underlay component to display the customer location
"use client"
import { useEffect, useRef, useState } from "react"
import mapboxgl from "mapbox-gl"
import "mapbox-gl/dist/mapbox-gl.css"
import { MapPin } from "lucide-react"

const getUserLocation = (
  setUserCords: React.Dispatch<
    React.SetStateAction<{ latitude: number; longitude: number }>
  >
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

const RequestMap = () => {
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const markerRef = useRef<mapboxgl.Marker | null>(null)
  const [userCords, setUserCords] = useState<{latitude: number; longitude: number}>({
    latitude: 18.03,
    longitude: -66.9,
  })

  // Initialize user location
  useEffect(() => {
    getUserLocation(setUserCords)
  }, [])

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current) return

    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN!
    
    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [userCords.longitude, userCords.latitude],
      zoom: 15,
    })

    // Clean up on unmount
    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
      }
    }
  }, []) // Empty dependency array since we only want to initialize once

  // Update marker when user location changes
  useEffect(() => {
    if (!mapRef.current) return

    // Remove existing marker if it exists
    if (markerRef.current) {
      markerRef.current.remove()
    }

    // Create new marker
    markerRef.current = new mapboxgl.Marker({
      color: "#FF0000",
      draggable: false
    })
      .setLngLat([userCords.longitude, userCords.latitude])
      .addTo(mapRef.current)

    // Center map on user location
    mapRef.current.flyTo({
      center: [userCords.longitude, userCords.latitude],
      zoom: 15,
      essential: true
    })
  }, [userCords.latitude, userCords.longitude])

  return (
    <div className="absolute inset-0 w-full h-full">
      <div
        ref={mapContainerRef}
        className="w-full h-full"
      />
    </div>
  )
}

export default RequestMap