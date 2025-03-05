import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import { LocationType } from '../types';

interface UseMapRouteProps {
  map: React.MutableRefObject<mapboxgl.Map | null>;
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

    return () => {
      if (map.current?.getLayer('route')) {
        map.current.removeLayer('route');
      }
      if (map.current?.getSource('route')) {
        map.current.removeSource('route');
      }
    };
  }, [mapReady]);

  // Calculate and display route
  const calculateRoute = async (from: LocationType, to: LocationType) => {
    if (!routeSource.current || !map.current || !showRoute) return;
    
    console.log("Calculating route from", from, "to", to);
    
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
      
      console.log(`Route received with ${coordinates.length} coordinate points`);
      
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
  };

  // Update route when locations change
  useEffect(() => {
    if (!mapReady || !showRoute || !mechanicLocation || !customerLocation) return;
    
    if (!routeCalculated.current) {
      calculateRoute(mechanicLocation, customerLocation);
    }
  }, [mapReady, showRoute, mechanicLocation, customerLocation]);

  return {
    routeCalculated,
    routeCoordinates,
    calculateRoute
  };
};
