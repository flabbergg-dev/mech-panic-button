"use client"

import { useEffect, useRef, useState, useMemo } from "react"
import mapboxgl from "mapbox-gl"
import "mapbox-gl/dist/mapbox-gl.css"
import { ServiceRequestMapProps } from './types'
import { toMapboxLngLat } from './utils'
import * as turf from '@turf/turf';

const ServiceRequestMap = ({
  serviceRequest,
  customerLocation,
  mechanicLocation,
  showMechanicLocation = false,
  showRoute = false,
  onRouteCalculated,
}: ServiceRequestMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapInitialized, setMapInitialized] = useState(false);
  
  const mechanicMarker = useRef<mapboxgl.Marker | null>(null);
  const customerMarker = useRef<mapboxgl.Marker | null>(null);
  const routeSource = useRef<mapboxgl.GeoJSONSource | null>(null);
  const routeCalculated = useRef<boolean>(false);

  // Initialize map once
  useEffect(() => {
    if (mapContainer.current && !map.current) {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [customerLocation.longitude, customerLocation.latitude],
        zoom: 15,
        accessToken: process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN
      });

      map.current.on('load', () => {
        // Add route source and layer
        if (map.current) {
          map.current.addSource('route', {
            type: 'geojson',
            data: {
              type: 'Feature',
              properties: {},
              geometry: {
                type: 'LineString',
                coordinates: []
              }
            }
          });

          map.current.addLayer({
            id: 'route',
            type: 'line',
            source: 'route',
            layout: {
              'line-join': 'round',
              'line-cap': 'round'
            },
            paint: {
              'line-color': '#3b82f6',
              'line-width': 4,
              'line-opacity': 0.8
            }
          });

          routeSource.current = map.current.getSource('route') as mapboxgl.GeoJSONSource;
          setMapInitialized(true);
        }
      });
    }

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [customerLocation.latitude, customerLocation.longitude]);

  // Update customer marker
  useEffect(() => {
    if (!map.current || !mapInitialized) return;

    const lngLat: [number, number] = [customerLocation.longitude, customerLocation.latitude];

    if (!customerMarker.current) {
      customerMarker.current = new mapboxgl.Marker({ color: "#4B5563" })
        .setPopup(new mapboxgl.Popup().setHTML("<p class='font-medium'>Customer Location</p>"))
        .setLngLat(lngLat)
        .addTo(map.current);
    } else {
      customerMarker.current.setLngLat(lngLat);
    }
  }, [mapInitialized, customerLocation]);

  // Update mechanic marker
  useEffect(() => {
    if (!map.current || !mapInitialized || !mechanicLocation || !showMechanicLocation) return;

    const lngLat: [number, number] = [mechanicLocation.longitude, mechanicLocation.latitude];

    if (!mechanicMarker.current) {
      const el = document.createElement('div');
      el.className = 'mechanic-marker';
      el.style.width = '24px';
      el.style.height = '24px';
      el.style.backgroundImage = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%233b82f6'%3E%3Cpath d='M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z'/%3E%3C/svg%3E")`;
      el.style.backgroundSize = '100%';

      mechanicMarker.current = new mapboxgl.Marker({ element: el })
        .setPopup(new mapboxgl.Popup().setHTML("<p class='font-medium'>Mechanic Location</p>"))
        .setLngLat(lngLat)
        .addTo(map.current);
    } else {
      mechanicMarker.current.setLngLat(lngLat);
    }

    // Update map bounds to show both markers
    if (customerMarker.current) {
      const bounds = new mapboxgl.LngLatBounds();
      bounds.extend(lngLat);
      bounds.extend([customerLocation.longitude, customerLocation.latitude]);
      map.current.fitBounds(bounds, { padding: 100, duration: 1000 });
    }
  }, [mapInitialized, mechanicLocation, showMechanicLocation, customerLocation]);

  // Calculate and update route
  useEffect(() => {
    if (!map.current || !mapInitialized || !showRoute || !mechanicLocation || !routeSource.current) return;

    const calculateRoute = async () => {
      try {
        // Check if mechanic is very close to customer (within 10 meters)
        const distanceToCustomer = turf.distance(
          turf.point([mechanicLocation.longitude, mechanicLocation.latitude]),
          turf.point([customerLocation.longitude, customerLocation.latitude]),
          { units: 'kilometers' }
        );

        if (distanceToCustomer < 0.01) { // If within 10 meters
          if (onRouteCalculated) {
            onRouteCalculated(0, 0);
          }
          routeCalculated.current = true;
          return;
        }

        const response = await fetch(
          `https://api.mapbox.com/directions/v5/mapbox/driving/${mechanicLocation.longitude},${mechanicLocation.latitude};${customerLocation.longitude},${customerLocation.latitude}?steps=true&geometries=geojson&overview=full&annotations=duration,distance,speed&access_token=${process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN}`
        );

        if (!response.ok) throw new Error('Route calculation failed');

        const data = await response.json();
        if (!data.routes?.length) throw new Error('No route found');

        const route = data.routes[0];
        routeSource.current?.setData({
          type: "Feature",
          properties: {},
          geometry: {
            type: "LineString",
            coordinates: route.geometry.coordinates,
          },
        });

        if (onRouteCalculated) {
          onRouteCalculated(
            Math.round(route.duration / 60), // Convert seconds to minutes
            Math.round(route.distance / 1000) // Convert meters to kilometers
          );
        }

        routeCalculated.current = true;
      } catch (error) {
        console.error('Error calculating route:', error);
        routeCalculated.current = false;
        if (onRouteCalculated) {
          onRouteCalculated(0, 0);
        }
      }
    };

    if (!routeCalculated.current) {
      calculateRoute();
    }
  }, [mapInitialized, showRoute, mechanicLocation, customerLocation, onRouteCalculated]);

  return (
    <div 
      ref={mapContainer} 
      className="w-full h-full rounded-lg shadow-lg"
      style={{ minHeight: '400px' }}
    />
  );
};

export default ServiceRequestMap;