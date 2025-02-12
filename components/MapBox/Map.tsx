"use client"

import { useEffect, useState } from "react"
import mapboxgl from "mapbox-gl"
import "mapbox-gl/dist/mapbox-gl.css"

interface Location {
  latitude: number
  longitude: number
}

interface MapMarker {
  location: Location
  color: string
  popupText: string
}

interface MapProps {
  center: Location
  markers: MapMarker[]
  showRoute?: boolean
  onRouteCalculated?: (duration: number) => void
}

export const Map = ({ center, markers, showRoute, onRouteCalculated }: MapProps) => {
  const [map, setMap] = useState<mapboxgl.Map | null>(null)

  useEffect(() => {
    if (!map) {
      // Set the access token for Mapbox
      mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || '';
      
      const newMap = new mapboxgl.Map({
        container: "map",
        style: "mapbox://styles/mapbox/streets-v12",
        center: [center.longitude, center.latitude],
        zoom: 13,
      })

      setMap(newMap)

      return () => {
        newMap.remove()
      }
    }
  }, [])

  useEffect(() => {
    if (!map) return

    // Clear existing markers
    const markerElements = document.getElementsByClassName('mapboxgl-marker')
    while(markerElements[0]) {
      markerElements[0].remove()
    }

    // Add new markers
    markers.forEach(marker => {
      new mapboxgl.Marker({ color: marker.color })
        .setLngLat([marker.location.longitude, marker.location.latitude])
        .setPopup(new mapboxgl.Popup().setHTML(marker.popupText))
        .addTo(map)
    })

    // Calculate and draw route if needed
    if (showRoute && markers.length >= 2) {
      const [start, end] = markers
      fetchRouteAndDraw(start.location, end.location)
    }
  }, [map, markers, showRoute])

  const fetchRouteAndDraw = async (start: Location, end: Location) => {
    try {
      
      const response = await fetch(
        `https://api.mapbox.com/directions/v5/mapbox/driving/` +
        `${start.longitude},${start.latitude};` +
        `${end.longitude},${end.latitude}` +
        `?steps=true&geometries=geojson` +
        `&access_token=${process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN!}` 
      )
      const data = await response.json()
      
      if (data.routes?.[0]) {
        console.log('Mapbox route data:', {
          durationSeconds: data.routes[0].duration,
          durationMinutes: Math.round(data.routes[0].duration / 60),
          distance: data.routes[0].distance, // in meters
          distanceKm: Math.round(data.routes[0].distance / 1000)
        });
        const duration = Math.round(data.routes[0].duration / 60)
        onRouteCalculated?.(duration)
        
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
    <div id="map" className="w-full h-full" />
  )
}
