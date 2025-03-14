import { useEffect, useRef, useCallback } from 'react';
import type { ServiceRequest } from '@prisma/client';

// Define location type locally since it's specific to this component
interface MechanicLocation {
  latitude: number;
  longitude: number;
}

interface UseLocationTrackingProps {
  serviceRequest: ServiceRequest | null;
  onLocationUpdate: (location: MechanicLocation) => void;
  mechanicLocation: MechanicLocation | null;
}

export function useLocationTracking({
  serviceRequest,
  onLocationUpdate,
  mechanicLocation,
}: UseLocationTrackingProps) {
  const watchId = useRef<number | null>(null);
  const lastUpdate = useRef<number>(0);
  const isMounted = useRef(true);
  // 60 seconds from memory
  const MIN_UPDATE_INTERVAL = 60000; 
  // 30 meters from memory
  const MIN_DISTANCE = 30; 

  // Cleanup function
  const cleanup = useCallback(() => {
    if (watchId.current !== null) {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }
  }, []);

  // Calculate distance between two points
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

  // Handle location updates with throttling and distance check
  const handleLocationUpdate = useCallback((position: GeolocationPosition) => {
    if (!isMounted.current) return;

    const now = Date.now();
    if (now - lastUpdate.current < MIN_UPDATE_INTERVAL) return;

    const newLocation = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    };

    // Check if we've moved enough to warrant an update
    if (mechanicLocation) {
      const distance = calculateDistance(
        mechanicLocation.latitude,
        mechanicLocation.longitude,
        newLocation.latitude,
        newLocation.longitude
      );

      if (distance < MIN_DISTANCE) return;
    }

    lastUpdate.current = now;
    onLocationUpdate(newLocation);
  }, [mechanicLocation, onLocationUpdate, calculateDistance]);

  // Start location tracking
  useEffect(() => {
    if (!serviceRequest?.mechanicId || serviceRequest.status !== 'IN_ROUTE') {
      cleanup();
      return;
    }

    if (!navigator.geolocation) {
      console.error('Geolocation is not supported by this browser.');
      return;
    }

    watchId.current = navigator.geolocation.watchPosition(
      handleLocationUpdate,
      (error) => console.error('Error getting location:', error),
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0,
      }
    );

    return cleanup;
  }, [serviceRequest?.mechanicId, serviceRequest?.status, handleLocationUpdate, cleanup]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMounted.current = false;
      cleanup();
    };
  }, [cleanup]);
}
