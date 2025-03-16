import { useState, useEffect, useCallback, useRef } from 'react';

interface GeolocationState {
  latitude: number | null;
  longitude: number | null;
  error: string | null;
}

interface UseGeolocationOptions {
  minDistance?: number;  // Minimum distance in meters before updating
  updateInterval?: number;  // Update interval in milliseconds
  timeout?: number; // Timeout in milliseconds
}

export function useGeolocation(options: UseGeolocationOptions = {}) {
  const [state, setState] = useState<GeolocationState>({
    latitude: null,
    longitude: null,
    error: null
  });

  const { 
    minDistance = 30,
    updateInterval = 60000,
    timeout = 10000 
  } = options;

  const lastUpdateTime = useRef<number>(0);
  const isMounted = useRef(true);

  const calculateDistance = useCallback((lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }, []);

  const shouldUpdatePosition = useCallback((newLat: number, newLng: number): boolean => {
    const now = Date.now();
    
    // Always update if this is the first position or if there was an error
    if (!state.latitude || !state.longitude || state.error) {
      lastUpdateTime.current = now;
      return true;
    }

    // Check time threshold
    if (now - lastUpdateTime.current < updateInterval) {
      return false;
    }

    // Check distance threshold
    const distance = calculateDistance(
      state.latitude,
      state.longitude,
      newLat,
      newLng
    );

    if (distance < minDistance) {
      return false;
    }

    lastUpdateTime.current = now;
    return true;
  }, [state.latitude, state.longitude, state.error, minDistance, updateInterval, calculateDistance]);

  const handlePositionUpdate = useCallback((position: GeolocationPosition) => {
    if (!isMounted.current) return;

    const newLat = position.coords.latitude;
    const newLng = position.coords.longitude;

    if (shouldUpdatePosition(newLat, newLng)) {
      setState({
        latitude: newLat,
        longitude: newLng,
        error: null
      });
    }
  }, [shouldUpdatePosition]);

  const handleError = useCallback((error: GeolocationPositionError) => {
    if (!isMounted.current) return;

    setState(prevState => ({
      ...prevState,
      error: error.message
    }));
  }, []);

  useEffect(() => {
    isMounted.current = true;

    if (!navigator.geolocation) {
      setState(prevState => ({
        ...prevState,
        error: 'Geolocation is not supported'
      }));
      return;
    }

    // Get initial position
    const initialPositionId = navigator.geolocation.getCurrentPosition(
      handlePositionUpdate,
      handleError,
      {
        enableHighAccuracy: true,
        timeout,
        maximumAge: 0 // Force fresh position
      }
    );

    // Set up watching position
    const watchId = navigator.geolocation.watchPosition(
      handlePositionUpdate,
      handleError,
      {
        enableHighAccuracy: true,
        timeout,
        maximumAge: updateInterval
      }
    );

    return () => {
      isMounted.current = false;
      navigator.geolocation.clearWatch(watchId);
    };
  }, [handlePositionUpdate, handleError, updateInterval, timeout]);

  return state;
}
