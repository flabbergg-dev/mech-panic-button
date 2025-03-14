import { useState, useEffect, useCallback } from 'react';
import { useGeolocation } from './useGeolocation';
import type { Map as MapboxMap } from 'mapbox-gl';

interface Location {
  latitude: number;
  longitude: number;
}

interface MapState {
  map: MapboxMap | null;
  userLocation: Location | null;
  mechanicLocation: Location | null;
  isLoading: boolean;
  error: string | null;
}

interface UseMapManagementOptions {
  minUpdateDistance?: number;
  updateInterval?: number;
}

export function useMapManagement(options: UseMapManagementOptions = {}) {
  const [mapState, setMapState] = useState<MapState>({
    map: null,
    userLocation: null,
    mechanicLocation: null,
    isLoading: true,
    error: null
  });

  const { latitude, longitude, error } = useGeolocation({
    minDistance: options.minUpdateDistance,
    updateInterval: options.updateInterval
  });

  useEffect(() => {
    if (error) {
      setMapState(prev => ({ ...prev, error, isLoading: false }));
      return;
    }

    if (latitude && longitude) {
      setMapState(prev => ({
        ...prev,
        mechanicLocation: { latitude, longitude },
        isLoading: false,
        error: null
      }));
    }
  }, [latitude, longitude, error]);

  const initializeMap = useCallback((map: MapboxMap) => {
    setMapState(prev => ({ ...prev, map }));
  }, []);

  const updateUserLocation = useCallback((location: Location) => {
    setMapState(prev => ({ ...prev, userLocation: location }));
  }, []);

  const updateMechanicLocation = useCallback((location: Location) => {
    setMapState(prev => ({ ...prev, mechanicLocation: location }));
  }, []);

  const calculateRoute = useCallback(async (start: Location, end: Location) => {
    try {
      const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${start.longitude},${start.latitude};${end.longitude},${end.latitude}?steps=true&geometries=geojson&access_token=${process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error('Failed to fetch route');
      }

      const data = await response.json();
      return data.routes[0];
    } catch (error) {
      setMapState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to calculate route'
      }));
      return null;
    }
  }, []);

  return {
    ...mapState,
    initializeMap,
    updateUserLocation,
    updateMechanicLocation,
    calculateRoute
  };
}
