import { useEffect, useRef } from 'react';
import { LocationType } from '../types';
import { ServiceStatus } from '@prisma/client';
import { getMechanicLocation } from '@/app/actions/location';

const STORAGE_KEY_PREFIX = {
  MECHANIC: "mechanic_location_",
  CUSTOMER: "customer_location_"
};

interface UseLocationTrackingProps {
  serviceRequest: {
    id: string;
    status: ServiceStatus;
    mechanicId?: string;
  };
  mechanicLocation?: LocationType;
  customerLocation?: LocationType;
  onLocationUpdate: (location: LocationType) => void;
}

export const useLocationTracking = ({
  serviceRequest,
  mechanicLocation,
  onLocationUpdate
}: UseLocationTrackingProps) => {
  const locationPollingInterval = useRef<NodeJS.Timeout | null>(null);
  const lastMechanicLocation = useRef<LocationType | null>(null);
  const currentStatus = useRef<ServiceStatus | null>(null);

  // Fetch mechanic location from server
  const fetchMechanicLocation = async () => {
    if (serviceRequest.status !== ServiceStatus.IN_ROUTE || !serviceRequest.mechanicId) return;
    
    try {
      console.log("Fetching mechanic location for mechanic ID:", serviceRequest.mechanicId);
      const location = await getMechanicLocation(serviceRequest.mechanicId);
      
      if (!location) {
        console.log("Server location not available, using fallback");
        if (mechanicLocation) {
          console.log("Using effective mechanic location from props or localStorage");
          return;
        }
        console.log("No fallback location available");
        return;
      }
      
      console.log("Received mechanic location:", location);
      
      // Only update if location has changed significantly
      if (!lastMechanicLocation.current || 
          Math.abs(lastMechanicLocation.current.latitude - location.latitude) > 0.0001 || 
          Math.abs(lastMechanicLocation.current.longitude - location.longitude) > 0.0001) {
        
        console.log("Location changed significantly, updating");
        lastMechanicLocation.current = location;
        
        // Store in localStorage
        try {
          localStorage.setItem(
            `${STORAGE_KEY_PREFIX.MECHANIC}${serviceRequest.id}`, 
            JSON.stringify(location)
          );
        } catch (e) {
          console.error("Failed to store mechanic location:", e);
        }
        
        onLocationUpdate(location);
      } else {
        console.log("Location hasn't changed significantly");
      }
    } catch (error) {
      console.error("Error fetching mechanic location:", error);
    }
  };

  // Start/stop location polling based on service status
  useEffect(() => {
    // Check if status has changed
    if (currentStatus.current !== serviceRequest.status) {
      console.log(`Status changed from ${currentStatus.current} to ${serviceRequest.status}`);
      currentStatus.current = serviceRequest.status;
    }
    
    // Start polling for IN_ROUTE status
    if (serviceRequest.status === ServiceStatus.IN_ROUTE && !locationPollingInterval.current) {
      console.log("Starting location polling for IN_ROUTE status");
      
      // Initial fetch
      fetchMechanicLocation();
      
      // Set up polling interval with a minimum of 5 seconds between updates
      locationPollingInterval.current = setInterval(fetchMechanicLocation, 5000);
    } 
    // Stop polling for other statuses
    else if (serviceRequest.status !== ServiceStatus.IN_ROUTE && locationPollingInterval.current) {
      console.log("Stopping location polling");
      clearInterval(locationPollingInterval.current);
      locationPollingInterval.current = null;
    }
    
    // Clean up on unmount or status change
    return () => {
      if (locationPollingInterval.current) {
        clearInterval(locationPollingInterval.current);
        locationPollingInterval.current = null;
      }
    };
  }, [serviceRequest.status]);

  return {
    lastMechanicLocation
  };
};
