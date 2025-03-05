import { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import { Location } from './useLocationTracking';

interface MapOptions {
  style?: string;
  zoom?: number;
  center?: [number, number];
}

interface RouteInfo {
  duration: number;
  distance: number;
}

interface UseMapManagementProps {
  containerId: string;
  customerLocation: Location | null;
  mechanicLocation: Location | null;
  showRoute?: boolean;
  onRouteCalculated?: (duration: number, distance: number) => void;
}

export const useMapManagement = ({
  containerId,
  customerLocation,
  mechanicLocation,
  showRoute = false,
  onRouteCalculated
}: UseMapManagementProps) => {
  const [isMapReady, setIsMapReady] = useState(false);
  const mapInstance = useRef<mapboxgl.Map | null>(null);
  const routeSource = useRef<mapboxgl.GeoJSONSource | null>(null);
  const customerMarker = useRef<mapboxgl.Marker | null>(null);
  const mechanicMarker = useRef<mapboxgl.Marker | null>(null);
  const lastRouteInfo = useRef<RouteInfo | null>(null);

  const initializeMap = useCallback((container: HTMLElement, options: MapOptions = {}) => {
    const {
      style = "mapbox://styles/mapbox/streets-v12",
      zoom = 14,
      center = [-74.5, 40] // Default center
    } = options;

    const map = new mapboxgl.Map({
      container,
      style,
      zoom,
      center,
      attributionControl: false
    });

    map.once('load', () => {
      // Add route source
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
      });

      // Add route casing layer
      map.addLayer({
        id: "route-casing",
        type: "line",
        source: "route",
        layout: {
          "line-join": "round",
          "line-cap": "round",
        },
        paint: {
          "line-color": "#000",
          "line-width": 8,
          "line-opacity": 0.6,
        },
      });

      // Add main route layer
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
          "line-opacity": 0.9,
          "line-dasharray": [0, 2, 1],
        },
      });

      routeSource.current = map.getSource("route") as mapboxgl.GeoJSONSource;
      mapInstance.current = map;
      setIsMapReady(true);
    });

    return map;
  }, []);

  const calculateRoute = useCallback(async (from: Location, to: Location) => {
    if (!routeSource.current || !mapInstance.current) {
      console.log("Route calculation skipped: map or route source not ready");
      return;
    }

    try {
      const response = await fetch(
        `https://api.mapbox.com/directions/v5/mapbox/driving/${from.longitude},${from.latitude};${to.longitude},${to.latitude}?steps=true&geometries=geojson&overview=full&annotations=duration,distance,speed&access_token=${process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN}`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch route: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.routes?.length || !routeSource.current) {
        throw new Error("No routes found or route source lost");
      }

      const route = data.routes[0];
      const { coordinates } = route.geometry;

      routeSource.current.setData({
        type: "Feature",
        properties: {},
        geometry: {
          type: "LineString",
          coordinates,
        },
      });

      lastRouteInfo.current = {
        duration: Math.round(route.duration / 60),
        distance: route.distance
      };

      if (onRouteCalculated) {
        onRouteCalculated(lastRouteInfo.current.duration, lastRouteInfo.current.distance);
      }

      // Fit bounds to show the entire route
      const bounds = new mapboxgl.LngLatBounds();
      coordinates.forEach((coord: [number, number]) => bounds.extend(coord));
      mapInstance.current.fitBounds(bounds, { padding: 50 });

    } catch (error) {
      console.error("Error calculating route:", error);
      if (onRouteCalculated) onRouteCalculated(0, 0);
    }
  }, [onRouteCalculated]);

  // Initialize map
  useEffect(() => {
    const container = document.getElementById(containerId);
    if (!container || mapInstance.current) return;

    const initialCenter = customerLocation 
      ? [customerLocation.longitude, customerLocation.latitude] as [number, number]
      : undefined;

    mapInstance.current = initializeMap(container, { center: initialCenter });

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [containerId, customerLocation, initializeMap]);

  // Update markers
  useEffect(() => {
    if (!isMapReady || !mapInstance.current) return;

    // Update customer marker
    if (customerLocation) {
      if (!customerMarker.current) {
        customerMarker.current = new mapboxgl.Marker({ color: "#4B5563" })
          .setPopup(new mapboxgl.Popup().setHTML("<p class='font-medium'>Customer Location</p>"))
          .setLngLat([customerLocation.longitude, customerLocation.latitude])
          .addTo(mapInstance.current);
      } else {
        customerMarker.current.setLngLat([customerLocation.longitude, customerLocation.latitude]);
      }
    }

    // Update mechanic marker
    if (mechanicLocation) {
      if (!mechanicMarker.current) {
        mechanicMarker.current = new mapboxgl.Marker({ color: "#10B981" })
          .setPopup(new mapboxgl.Popup().setHTML("<p class='font-medium'>Mechanic Location</p>"))
          .setLngLat([mechanicLocation.longitude, mechanicLocation.latitude])
          .addTo(mapInstance.current);
      } else {
        mechanicMarker.current.setLngLat([mechanicLocation.longitude, mechanicLocation.latitude]);
      }
    }
  }, [isMapReady, customerLocation, mechanicLocation]);

  // Calculate route when needed
  useEffect(() => {
    if (!isMapReady || !showRoute || !customerLocation || !mechanicLocation) return;
    calculateRoute(mechanicLocation, customerLocation);
  }, [isMapReady, showRoute, customerLocation, mechanicLocation, calculateRoute]);

  return {
    isMapReady,
    map: mapInstance.current,
    lastRouteInfo: lastRouteInfo.current
  };
};
