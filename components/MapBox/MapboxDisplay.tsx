"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import mapboxgl from "mapbox-gl"
import "mapbox-gl/dist/mapbox-gl.css"
import { toast } from "sonner"

interface Location {
  latitude: number
  longitude: number
}

interface MapMarker {
  location: Location
  color: string
  popupText?: string
}

interface RouteStep {
  distance: number
  duration: number
  geometry: {
    coordinates: [number, number][];
    type: string;
  };
  maneuver: {
    instruction: string;
    type: string;
  };
}

interface MapProps {
  center?: {
    latitude: number;
    longitude: number;
  };
  markers?: Array<{
    location: {
      latitude: number;
      longitude: number;
    };
    color: string;
    popupText?: string;
  }>;
  showRoute?: boolean;
  followMechanic?: boolean;
  onRouteCalculated?: (duration: number, steps: RouteStep[], distance: number) => void;
}

export default function MapboxDisplay({ 
  center = { latitude: 40, longitude: -74.5 },
  markers = [], 
  showRoute = false, 
  followMechanic = false, 
  onRouteCalculated 
}: MapProps) {
  const [map, setMap] = useState<mapboxgl.Map | null>(null);
  const [isFollowingMechanic, setIsFollowingMechanic] = useState(followMechanic);

  // Use ref for tracking markers
  const existingMarkers = useRef<mapboxgl.Marker[]>([]);
  const routeLayerRef = useRef<boolean>(false);

  // Initialize map
  useEffect(() => {
    if (!map) {
      // Validate environment variables
      const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
      if (!mapboxToken) {
        throw new Error('Missing required environment variable: NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN');
      }
      mapboxgl.accessToken = mapboxToken;
      
      const newMap = new mapboxgl.Map({
        container: "map",
        style: "mapbox://styles/mapbox/streets-v12",
        center: [center.longitude, center.latitude],
        zoom: 9,
      });

      setMap(newMap);
    }
  }, [map, center]);

  useEffect(() => {
    // Enable following mechanic when route starts
    if (!showRoute) return;
    setIsFollowingMechanic(showRoute);
  }, [showRoute]);

  useEffect(() => {
    if (!map || !markers || markers.length < 2) return;

    // Get mechanic marker (last marker)
    const mechanicLocation = markers[markers.length - 1].location;
    
    // Pan map to mechanic location
    map.panTo([mechanicLocation.longitude, mechanicLocation.latitude], {
      duration: 1000,
      essential: true
    });
  }, [map, markers]);

  useEffect(() => {
    if (!map || !markers || markers.length === 0 || !isFollowingMechanic) return;

    const mechanicMarker = markers[markers.length - 1];
    if (mechanicMarker?.location) {
      map.flyTo({
        center: [mechanicMarker.location.longitude, mechanicMarker.location.latitude],
        zoom: 14,
        duration: 2000,
      });
    }
  }, [map, markers, isFollowingMechanic]);

  // Memoize marker cleanup function
  const removeExistingMarkers = useCallback(() => {
    for (const marker of existingMarkers.current) {
      marker.remove();
    }
    existingMarkers.current = [];
  }, []);

  // Memoize route cleanup function
  const removeExistingRoute = useCallback(() => {
    if (map && routeLayerRef.current) {
      if (map.getLayer('route')) {
        map.removeLayer('route');
      }
      if (map.getSource('route')) {
        map.removeSource('route');
      }
      routeLayerRef.current = false;
    }
  }, [map]);

  // Handle marker click with proper null checks
  const handleMarkerClick = useCallback((marker: mapboxgl.Marker) => {
    const coordinates = marker.getLngLat();
    const description = marker.getElement().getAttribute('data-description') || '';
    
    if (!map || !coordinates) return;
    
    const popup = new mapboxgl.Popup({ offset: 25 })
      .setLngLat(coordinates)
      .setHTML(description)
      .addTo(map);
  }, [map]);

  // Add markers with proper null and bounds checks
  useEffect(() => {
    if (!map || !markers || markers.length === 0) return;

    // Remove existing markers
    removeExistingMarkers();

    const bounds = new mapboxgl.LngLatBounds();
    let hasValidMarkers = false;

    for (const marker of markers) {
      if (!marker.location) continue;

      const element = document.createElement('div');
      element.className = 'marker';
      element.innerHTML = `
        <div class="w-8 h-8 rounded-full border-2 flex items-center justify-center" style="background-color: ${marker.color}; border-color: white;">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd" />
          </svg>
        </div>
      `;

      const mapMarker = new mapboxgl.Marker(element)
        .setLngLat([marker.location.longitude, marker.location.latitude]);

      if (marker.popupText) {
        const popup = new mapboxgl.Popup({ offset: 25 })
          .setHTML(marker.popupText);
        mapMarker.setPopup(popup);
      }

      mapMarker.addTo(map);
      existingMarkers.current.push(mapMarker);

      bounds.extend([marker.location.longitude, marker.location.latitude]);
      hasValidMarkers = true;
    }

    // Only fit bounds if we have valid markers
    if (hasValidMarkers && !bounds.isEmpty()) {
      map.fitBounds(bounds, {
        padding: 50,
        maxZoom: 15
      });
    }

    return () => {
      removeExistingMarkers();
    };
  }, [map, markers, removeExistingMarkers]);

  // Memoize route fetching and drawing
  const fetchRouteAndDraw = useCallback(async (start: Location, end: Location) => {
    if (!map) return;

    try {
      // Validate environment variables
      const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
      if (!mapboxToken) {
        throw new Error('Missing required environment variable: NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN');
      }

      const response = await fetch(
        `https://api.mapbox.com/directions/v5/mapbox/driving/${start.longitude},${start.latitude};${end.longitude},${end.latitude}?geometries=geojson&steps=true&overview=full&access_token=${mapboxToken}`
      );

      if (!response.ok) {
        throw new Error(`Mapbox API error: ${response.statusText}`);
      }

      const data = await response.json();
      if (!data.routes?.[0]?.geometry?.coordinates) {
        throw new Error('No route found');
      }

      // Clean up existing route
      removeExistingRoute();

      // Add new route
      map.addSource('route', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: data.routes[0].geometry.coordinates
          }
        }
      });

      map.addLayer({
        id: 'route',
        type: 'line',
        source: 'route',
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': '#3b82f6',
          'line-width': 4
        }
      });

      routeLayerRef.current = true;

      if (onRouteCalculated) {
        const steps: RouteStep[] = data.routes[0].legs[0].steps;
        const duration = data.routes[0].duration;
        const distance = data.routes[0].distance;
        onRouteCalculated(duration, steps, distance);
      }
    } catch (error) {
      console.error('Error fetching route:', error);
    }
  }, [map, removeExistingRoute, onRouteCalculated]);

  // Handle route updates
  useEffect(() => {
    if (!map || !map.isStyleLoaded()) {
      toast('Map loading...');
      return;
    }

    // If showRoute and we have at least 2 markers, draw the route
    if (showRoute && markers.length >= 2) {
      const start = markers[markers.length - 1].location; // Mechanic location (last marker)
      const end = markers[0].location; // Customer location (first marker)
      if (start && end) {
        void fetchRouteAndDraw(start, end);
      }
    } else {
      removeExistingRoute();
    }

    return () => {
      removeExistingRoute();
    };
  }, [map, markers, showRoute, fetchRouteAndDraw, removeExistingRoute]);

  useEffect(() => {
    setIsFollowingMechanic(followMechanic);
  }, [followMechanic]);

  return (
    <div id="map" className="w-full h-full" />
  )
}