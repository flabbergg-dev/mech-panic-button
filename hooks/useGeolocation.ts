'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { updateMechanicLocationAction } from '@/app/actions/mechanic/updateMechanicLocationAction'

interface Location {
  latitude: number;
  longitude: number;
}

interface UseGeolocationReturn {
  location: Location | null;
  error: string | null;
  isLoading: boolean;
}

const MINIMUM_DISTANCE = 30; // meters
const WATCH_INTERVAL = 60000; // 60 seconds

export function useGeolocation(): UseGeolocationReturn {
  const [location, setLocation] = useState<Location | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const lastLocation = useRef<Location | null>(null);
  const watchId = useRef<number | null>(null);

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  };

  const handleLocationChange = useCallback(async (position: GeolocationPosition) => {
    const newLocation = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude
    };

    // Check if we've moved enough to update
    if (lastLocation.current) {
      const distance = calculateDistance(
        lastLocation.current.latitude,
        lastLocation.current.longitude,
        newLocation.latitude,
        newLocation.longitude
      );

      if (distance < MINIMUM_DISTANCE) {
        console.log(`Location change (${distance.toFixed(2)}m) below minimum threshold (${MINIMUM_DISTANCE}m), skipping update`);
        return;
      }
    }

    console.log('Significant location change detected, updating...', newLocation);
    
    try {
      const locationPayload = {
        latitude: Number(newLocation.latitude.toFixed(6)),
        longitude: Number(newLocation.longitude.toFixed(6))
      };

      const result = await updateMechanicLocationAction(locationPayload);
      if (result.success) {
        setLocation(locationPayload);
        lastLocation.current = locationPayload;
        setError(null);
        console.log('Location updated successfully:', locationPayload);
      } else {
        console.error('Failed to update location:', result.error);
        setError(result.error || 'Failed to update location');
      }
    } catch (err) {
      console.error('Error updating location:', err);
      setError(err instanceof Error ? err.message : 'Failed to update location');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleError = useCallback((error: GeolocationPositionError) => {
    console.error('Geolocation error:', error);
    setError(error.message);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      setIsLoading(false);
      return;
    }

    // Get initial location
    navigator.geolocation.getCurrentPosition(handleLocationChange, handleError);

    // Set up location watching
    watchId.current = navigator.geolocation.watchPosition(
      handleLocationChange,
      handleError,
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: WATCH_INTERVAL
      }
    );

    return () => {
      if (watchId.current !== null) {
        navigator.geolocation.clearWatch(watchId.current);
      }
    };
  }, [handleLocationChange, handleError]);

  return { location, error, isLoading };
}
