import { useEffect, useRef, useCallback, type RefObject } from 'react';
import type { LocationType } from '../types';
import type mapboxgl from 'mapbox-gl';

interface UseMapRouteProps {
  map: RefObject<mapboxgl.Map>;
  mapReady: boolean;
  showRoute: boolean;
  mechanicLocation?: LocationType;
  customerLocation?: LocationType;
  onRouteCalculated?: (duration: number, distance: number) => void;
}

export const useMapRoute = ({
  map,
  mapReady,
  showRoute,
  mechanicLocation,
  customerLocation,
  onRouteCalculated
}: UseMapRouteProps) => {
  const routeSource = useRef<mapboxgl.GeoJSONSource | null>(null);
  const routeCalculated = useRef<boolean>(false);
  const routeCoordinates = useRef<[number, number][]>([]);

  // Initialize route layer
  useEffect(() => {
    if (!mapReady || !map.current) return;

    const mapInstance = map.current;

    mapInstance.addSource('route', {
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

    mapInstance.addLayer({
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

    routeSource.current = mapInstance.getSource('route') as mapboxgl.GeoJSONSource;

    return () => {
      if (mapInstance?.getLayer('route')) {
        mapInstance.removeLayer('route');
      }
      if (mapInstance?.getSource('route')) {
        mapInstance.removeSource('route');
      }
    };
  }, [mapReady, map]);

  // Calculate and display route with debouncing
  const calculateRoute = useCallback(async (from: LocationType, to: LocationType) => {
    if (!routeSource.current || !map.current || !showRoute) return;

    const mapInstance = map.current;
       
    try {
      const response = await fetch(
        `https://api.mapbox.com/directions/v5/mapbox/driving/${from.longitude},${from.latitude};${to.longitude},${to.latitude}?steps=true&geometries=geojson&overview=full&annotations=duration,distance,speed&access_token=${process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN}`
      );
      
      if (!response.ok) {
        throw new Error(`Failed to fetch route: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.routes?.length || !routeSource.current) {
        console.error("No routes found or route source lost");
        if (onRouteCalculated) onRouteCalculated(0, 0);
        return;
      }
      
      const route = data.routes[0];
      const { coordinates } = route.geometry;
      
      routeCoordinates.current = coordinates;
      routeCalculated.current = true;
      
      routeSource.current.setData({
        type: "Feature",
        properties: {},
        geometry: {
          type: "LineString",
          coordinates,
        },
      });
      
      if (onRouteCalculated) {
        onRouteCalculated(
          Math.round(route.duration / 60), // Convert to minutes
          Math.round(route.distance / 1000) // Convert to kilometers
        );
      }
    } catch (error) {
      console.error("Error calculating route:", error);
      routeCalculated.current = false;
      if (onRouteCalculated) onRouteCalculated(0, 0);
    }
  }, [map, showRoute, onRouteCalculated]);

  // Update route when locations change
  useEffect(() => {
    if (!mapReady || !showRoute || !mechanicLocation || !customerLocation) return;
    
    // Add debouncing to prevent excessive API calls
    const timeoutId = setTimeout(() => {
      if (!routeCalculated.current) {
        calculateRoute(mechanicLocation, customerLocation);
      }
    }, 1000); // 1-second debounce

    return () => clearTimeout(timeoutId);
  }, [mapReady, showRoute, mechanicLocation, customerLocation, calculateRoute]);

  return {
    routeCalculated,
    routeCoordinates,
    calculateRoute
  };
};
