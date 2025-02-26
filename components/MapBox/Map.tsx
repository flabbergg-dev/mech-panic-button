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
  onRouteCalculated?: (duration: number, steps: any[], distance: number) => void
}

const Map = ({ center, markers, showRoute, onRouteCalculated }: MapProps) => {
  const [map, setMap] = useState<mapboxgl.Map | null>(null)
  const [followMechanic, setFollowMechanic] = useState(false)

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

      // Wait for the style to load before setting the map
      newMap.on('style.load', () => {
        console.log('Map style loaded');
        setMap(newMap)
      });

      return () => {
        newMap.remove()
      }
    }
  }, [])

  useEffect(() => {
    // Enable following mechanic when route starts
    if (!showRoute) return;
    setFollowMechanic(showRoute);
  }, [showRoute]);

  useEffect(() => {
    if (!map || !followMechanic || markers.length < 2) return;

    // Get mechanic marker (last marker)
    const mechanicLocation = markers[markers.length - 1].location;
    
    // Pan map to mechanic location
    map.panTo([mechanicLocation.longitude, mechanicLocation.latitude], {
      duration: 1000,
      essential: true
    });
  }, [map, markers, followMechanic]);

  const removeExistingRoute = () => {
    if (!map) return;

    // Remove layers first
    if (map.getLayer('route-line')) {
      map.removeLayer('route-line');
    }
    if (map.getLayer('route-point')) {
      map.removeLayer('route-point');
    }

    // Then remove source
    if (map.getSource('route')) {
      map.removeSource('route');
    }
  };

  useEffect(() => {
    if (!map || !map.isStyleLoaded()) {
      console.log('Map not ready yet');
      return;
    }

    // Clear existing markers
    markers.forEach((_, index) => {
      const el = document.getElementById(`marker-${index}`);
      if (el) el.remove();
    });

    // Add new markers
    markers.forEach((marker, index) => {
      if (!marker.location) return;

      const el = document.createElement('div');
      el.id = `marker-${index}`;
      el.className = 'marker';
      el.innerHTML = `
        <div class="w-8 h-8 rounded-full border-2 flex items-center justify-center" style="background-color: ${marker.color}; border-color: white;">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd" />
          </svg>
        </div>
      `;

      // Add popup if provided
      if (marker.popupText) {
        const popup = new mapboxgl.Popup({ offset: 25 })
          .setHTML(marker.popupText);

        new mapboxgl.Marker(el)
          .setLngLat([marker.location.longitude, marker.location.latitude])
          .setPopup(popup)
          .addTo(map);
      } else {
        new mapboxgl.Marker(el)
          .setLngLat([marker.location.longitude, marker.location.latitude])
          .addTo(map);
      }
    });

    // If showRoute and we have at least 2 markers, draw the route
    if (showRoute && markers.length >= 2) {
      const start = markers[markers.length - 1].location; // Mechanic location (last marker)
      const end = markers[0].location; // Customer location (first marker)
      if (start && end) {
        fetchRouteAndDraw(start, end);
      }
    } else {
      // If not showing route, remove existing route
      removeExistingRoute();
    }
  }, [map, markers, showRoute]);

  const fetchRouteAndDraw = async (start: Location, end: Location) => {
    try {
      console.log('Fetching route from:', start, 'to:', end);
      console.log('Map instance exists:', !!map);
      
      const response = await fetch(
        `https://api.mapbox.com/directions/v5/mapbox/driving/` +
        `${start.longitude},${start.latitude};` +
        `${end.longitude},${end.latitude}` +
        `?steps=true&geometries=geojson` +
        `&access_token=${process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN!}` 
      );
      const data = await response.json();
      
      if (data.routes?.[0]) {
        console.log('Mapbox route data:', {
          durationSeconds: data.routes[0].duration,
          durationMinutes: Math.round(data.routes[0].duration / 60),
          distance: data.routes[0].distance,
          geometry: data.routes[0].geometry ? 'Present' : 'Missing',
          steps: data.routes[0].steps || []
        });

        const duration = Math.round(data.routes[0].duration / 60);
        onRouteCalculated?.(duration, data.routes[0].steps || [], data.routes[0].distance);
        
        if (map && data.routes[0].geometry) {
          console.log('Attempting to add/update route layer');

          // Remove existing route if any
          removeExistingRoute();

          // Add the new route source and layer
          map.addSource('route', {
            type: 'geojson',
            data: {
              type: 'Feature',
              properties: {},
              geometry: data.routes[0].geometry
            }
          });

          map.addLayer({
            id: 'route-line',
            type: 'line',
            source: 'route',
            layout: {
              'line-join': 'round',
              'line-cap': 'round'
            },
            paint: {
              'line-color': '#3b82f6',
              'line-width': 4,
              'line-opacity': 0.75
            }
          });

          // Add dots along the route
          map.addLayer({
            id: 'route-point',
            type: 'circle',
            source: 'route',
            paint: {
              'circle-radius': 3,
              'circle-color': '#ffffff',
              'circle-opacity': 0.8,
              'circle-stroke-width': 1,
              'circle-stroke-color': '#3b82f6'
            }
          });
        }
      }
    } catch (error) {
      console.error('Error fetching or drawing route:', error);
    }
  };

  return (
    <div id="map" className="w-full h-full" />
  )
}

export default Map;