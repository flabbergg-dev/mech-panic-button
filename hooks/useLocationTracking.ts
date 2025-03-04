import { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from '@/hooks/use-toast';

export interface Location {
  latitude: number;
  longitude: number;
}

interface LocationTrackingOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  minDistanceChange?: number;
  updateInterval?: number;
}

interface UseLocationTrackingProps {
  onLocationUpdate?: (location: Location) => Promise<void>;
  isTracking: boolean;
  options?: LocationTrackingOptions;
}

export const useLocationTracking = ({
  onLocationUpdate,
  isTracking,
  options = {}
}: UseLocationTrackingProps) => {
  const [location, setLocation] = useState<Location | null>(null);
  const [error, setError] = useState<string | null>(null);
  const lastUpdateTime = useRef(0);
  const watchId = useRef<number | null>(null);

  const {
    enableHighAccuracy = true,
    timeout = 15000,
    maximumAge = 0,
    minDistanceChange = 0.0003, // ~30 meters
    updateInterval = 60000 // 60 seconds
  } = options;

  const getLocationErrorMessage = (error: GeolocationPositionError): string => {
    switch (error.code) {
      case GeolocationPositionError.PERMISSION_DENIED:
        return "Please enable location services in your browser settings.";
      case GeolocationPositionError.POSITION_UNAVAILABLE:
        return "Location information is unavailable.";
      case GeolocationPositionError.TIMEOUT:
        return "Location request timed out.";
      default:
        return `An unknown error occurred (${error.message}).`;
    }
  };

  const hasSignificantChange = useCallback((newLocation: Location): boolean => {
    if (!location) return true;
    
    return Math.abs(location.latitude - newLocation.latitude) > minDistanceChange ||
           Math.abs(location.longitude - newLocation.longitude) > minDistanceChange;
  }, [location, minDistanceChange]);

  const handleLocationUpdate = useCallback(async (position: GeolocationPosition) => {
    const currentTime = Date.now();
    const newLocation = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    };

    if (hasSignificantChange(newLocation)) {
      // Update local state
      requestAnimationFrame(() => {
        setLocation(newLocation);
        setError(null);
      });

      // Call update callback if enough time has passed
      if (onLocationUpdate && currentTime - lastUpdateTime.current >= updateInterval) {
        try {
          await onLocationUpdate(newLocation);
          lastUpdateTime.current = currentTime;
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to update location';
          setError(message);
          toast({
            title: "Location Update Error",
            description: message,
            variant: "destructive"
          });
        }
      }
    }
  }, [hasSignificantChange, onLocationUpdate, updateInterval]);

  const handleLocationError = useCallback((error: GeolocationPositionError) => {
    const errorMessage = getLocationErrorMessage(error);
    setError(errorMessage);
    toast({
      title: "Location Error",
      description: errorMessage,
      variant: "destructive"
    });
  }, []);

  // Start/stop location tracking
  useEffect(() => {
    if (!navigator.geolocation || !isTracking) {
      return () => {};
    }

    // Get initial location
    navigator.geolocation.getCurrentPosition(
      handleLocationUpdate,
      handleLocationError,
      { enableHighAccuracy, timeout, maximumAge }
    );

    // Set up continuous tracking
    watchId.current = navigator.geolocation.watchPosition(
      handleLocationUpdate,
      handleLocationError,
      { enableHighAccuracy, timeout, maximumAge }
    );

    // Cleanup
    return () => {
      if (watchId.current !== null) {
        navigator.geolocation.clearWatch(watchId.current);
        watchId.current = null;
      }
    };
  }, [
    isTracking,
    handleLocationUpdate,
    handleLocationError,
    enableHighAccuracy,
    timeout,
    maximumAge
  ]);

  return { location, error };
};
