import { useState, useEffect, useCallback } from 'react';

interface GeolocationState {
  latitude: number;
  longitude: number;
  error: string | null;
}

interface UseGeolocationOptions {
  minDistance?: number;  // Minimum distance in meters before updating
  updateInterval?: number;  // Update interval in milliseconds
}

export function useGeolocation(options: UseGeolocationOptions = {}) {
  const [state, setState] = useState<GeolocationState>({
    latitude: 0,
    longitude: 0,
    error: null
  });

  const { minDistance = 30, updateInterval = 60000 } = options;

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
  }, [])

  const handlePositionUpdate = useCallback((position: GeolocationPosition) => {
    setState(prevState => {
      const newLat = position.coords.latitude;
      const newLng = position.coords.longitude;

      // Check if the distance moved is greater than minDistance
      if (prevState.latitude && prevState.longitude) {
        const distance = calculateDistance(
          prevState.latitude,
          prevState.longitude,
          newLat,
          newLng
        );

        if (distance < minDistance) {
          return prevState;
        }
      }

      return {
        latitude: newLat,
        longitude: newLng,
        error: null
      };
    });
  }, [calculateDistance, minDistance]);

  const handleError = useCallback((error: GeolocationPositionError) => {
    setState(prevState => ({
      ...prevState,
      error: error.message
    }));
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) {
      setState(prevState => ({
        ...prevState,
        error: 'Geolocation is not supported'
      }));
      return;
    }

    // Get initial position
    navigator.geolocation.getCurrentPosition(handlePositionUpdate, handleError);

    // Set up watching position with throttling
    const watchId = navigator.geolocation.watchPosition(
      handlePositionUpdate,
      handleError,
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: updateInterval
      }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [handlePositionUpdate, handleError, updateInterval]);

  return state;
}
