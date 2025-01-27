"use client"

import React, { useEffect, useMemo, useRef } from "react"
import mapboxgl from "mapbox-gl"

import "mapbox-gl/dist/mapbox-gl.css"

interface MapboxProps {
  userCords: { latitude: number; longitude: number }
}

export const ModalMapComp = ({ userCords }: MapboxProps) => {
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const mapContainerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN!
    if (mapContainerRef.current) {
      mapRef.current = new mapboxgl.Map({
        container: mapContainerRef.current,
        center: [-66.9, 18.03],
        zoom: 9,
      })
    }

    if (mapRef.current) {
      new mapboxgl.Marker()
        .setLngLat([userCords.longitude, userCords.latitude])
        .addTo(mapRef.current)
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
      } else {
        return
      }
    }
  }, [userCords.latitude, userCords.longitude])

  return (
    <div className="relative">
      <div
        id="map-container"
        style={{
          height: "35svh",
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,

          zIndex: 0,
        }}
        ref={mapContainerRef}
      ></div>
    </div>
  )
}
