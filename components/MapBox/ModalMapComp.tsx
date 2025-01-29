"use client"

import React, { useEffect, useRef, useState } from "react"
import mapboxgl from "mapbox-gl"

import "mapbox-gl/dist/mapbox-gl.css"

const metersToPixelsAtMaxZoom = (meters: number, latitude: number) => {
  const earthCircumference = 40075017;
  const latitudeRadians = latitude * (Math.PI / 180);
  // Return value will be pixels at zoom level 20
  return (meters * (512 / earthCircumference) * Math.cos(latitudeRadians) * Math.pow(2, 20));
}

interface MapboxProps {
  userCords: { latitude: number; longitude: number }
  onLocationUpdate?: (coords: { latitude: number; longitude: number }) => void
}

export const ModalMapComp = ({ userCords, onLocationUpdate }: MapboxProps) => {
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const markerRef = useRef<mapboxgl.Marker | null>(null)
  const radiusCircleRef = useRef<mapboxgl.GeoJSONSource | null>(null)
  const isInitializedRef = useRef(false)

  // Function to calculate distance between two points in kilometers
  const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number => {
    const R = 6371 // Earth's radius in km
    const dLat = (lat2 - lat1) * (Math.PI / 180)
    const dLon = (lon2 - lon1) * (Math.PI / 180)
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  useEffect(() => {
    if (isInitializedRef.current) return;
    isInitializedRef.current = true;

    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN!
    if (mapContainerRef.current) {
      mapRef.current = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [userCords.longitude, userCords.latitude],
        zoom: 16,
        interactive: true,
        dragRotate: true,
        dragPan: true,
        scrollZoom: true,
        boxZoom: false,
        doubleClickZoom: false,
        touchZoomRotate: true,
        pitch: 0,
        bearing: 0,
      })

      // Add zoom and rotation controls
      mapRef.current.addControl(new mapboxgl.NavigationControl())

      // Create a draggable marker
      markerRef.current = new mapboxgl.Marker({
        color: "#FF0000",
        scale: 1.2,
        draggable: true
      })
        .setLngLat([userCords.longitude, userCords.latitude])
        .addTo(mapRef.current)

      // Add 100m radius circle
      mapRef.current.on('load', () => {
        if (!mapRef.current) return

        // Create a source for the radius circle - using original coordinates
        mapRef.current.addSource('radius-circle', {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'Point',
              coordinates: [userCords.longitude, userCords.latitude]
            }
          }
        })

        // Add a fill layer for the radius
        mapRef.current.addLayer({
          id: 'radius-fill',
          type: 'circle',
          source: 'radius-circle',
          paint: {
            'circle-radius': {
              base: 2,
              stops: [
                [0, 0],
                [20, metersToPixelsAtMaxZoom(100, userCords.latitude)]
              ]
            },
            'circle-color': '#ff0000',
            'circle-opacity': 0.1,
            'circle-stroke-width': 2,
            'circle-stroke-color': '#ff0000',
            'circle-stroke-opacity': 0.3
          }
        })

        radiusCircleRef.current = mapRef.current.getSource('radius-circle') as mapboxgl.GeoJSONSource
      })

      // Handle marker drag
      markerRef.current.on('dragend', () => {
        if (!markerRef.current || !mapRef.current) return

        const newPosition = markerRef.current.getLngLat()
        const distance = calculateDistance(
          userCords.latitude,
          userCords.longitude,
          newPosition.lat,
          newPosition.lng
        )

        // If marker is dragged beyond 100 meters (0.1 km), reset to the boundary
        if (distance > 0.1) {
          // Calculate new position at 100m boundary
          const angle = Math.atan2(
            newPosition.lat - userCords.latitude,
            newPosition.lng - userCords.longitude
          )
          const lat = userCords.latitude + Math.sin(angle) * (0.1 / 111.32)
          const lng = userCords.longitude + Math.cos(angle) * (0.1 / (111.32 * Math.cos(userCords.latitude * (Math.PI / 180))))
          
          markerRef.current.setLngLat([lng, lat])
          newPosition.lat = lat
          newPosition.lng = lng
        }

        // Update coordinates through callback
        if (onLocationUpdate) {
          onLocationUpdate({
            latitude: newPosition.lat,
            longitude: newPosition.lng
          })
        }
      })

      // Update position during drag but don't move the radius circle
      markerRef.current.on('drag', () => {
        if (!markerRef.current) return
        const position = markerRef.current.getLngLat()
        
        // Calculate distance during drag for visual feedback
        const distance = calculateDistance(
          userCords.latitude,
          userCords.longitude,
          position.lat,
          position.lng
        )

        // Update marker color based on whether it's within bounds
        const marker = markerRef.current.getElement()
        if (distance > 0.1) {
          marker.style.filter = 'hue-rotate(120deg)' // Makes it appear more reddish
        } else {
          marker.style.filter = 'none'
        }
      })
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
      }
      isInitializedRef.current = false;
    }
  }, []) // Only run on mount

  // Handle userCords updates
  useEffect(() => {
    if (!isInitializedRef.current || !mapRef.current || !markerRef.current) return;

    mapRef.current.setCenter([userCords.longitude, userCords.latitude])
    markerRef.current.setLngLat([userCords.longitude, userCords.latitude])
    
    if (radiusCircleRef.current) {
      radiusCircleRef.current.setData({
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'Point',
          coordinates: [userCords.longitude, userCords.latitude]
        }
      })
    }
  }, [userCords])

  return (
    <div className="relative w-full h-full">
      <div
        ref={mapContainerRef}
        style={{
          height: "100%",
          width: "100%",
          borderRadius: "0.375rem"
        }}
      />
      <div className="absolute bottom-2 left-2 bg-white/80 px-2 py-1 rounded text-xs">
        Drag the marker to adjust location (max 100m radius)
      </div>
    </div>
  )
}
