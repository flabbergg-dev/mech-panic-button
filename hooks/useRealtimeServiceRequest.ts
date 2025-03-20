'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useUser } from '@clerk/nextjs'
import type{ ServiceRequest } from '@prisma/client'
import { supabase } from '@/utils/supabase/client'
import type { RealtimePostgresChangesPayload } from '@/types/supabase'

// Define the interface for the API response
interface ServiceRequestWithMechanicLocation extends Omit<ServiceRequest, 'mechanicLocation'> {
  mechanicLocation: {
    latitude: number;
    longitude: number;
  } | null;
  completionCode: string | null;
  mechanic?: {
    user?: {
      id: string;
      firstName: string;
      lastName: string;
      stripeCustomerId: string | null;
    }
  }
}

interface UseRealtimeServiceRequestReturn {
  serviceRequest: ServiceRequestWithMechanicLocation | null
  serviceRequestLoading: boolean
  serviceRequestError: Error | null
  refetchServiceRequest: () => Promise<void>
  refreshRequest: () => void
  resetLocationChanged: () => void
  locationChanged: boolean
}

const FETCH_THROTTLE_MS = 5000; // 5 seconds between fetches
const POLLING_INTERVAL_MS = 10000; // 10 seconds between polls
const DEBOUNCE_MS = 1000; // 1 second debounce

export function useRealtimeServiceRequest(userId?: string): UseRealtimeServiceRequestReturn {
  const { user } = useUser()
  const [serviceRequest, setServiceRequest] = useState<ServiceRequestWithMechanicLocation | null>(null)
  const [serviceRequestLoading, setServiceRequestLoading] = useState(false)
  const [serviceRequestError, setServiceRequestError] = useState<Error | null>(null)
  const [locationChanged, setLocationChanged] = useState(false)
  
  const lastFetchTime = useRef<number>(0)
  const isFetching = useRef<boolean>(false)
  const isMounted = useRef<boolean>(true)
  const previousLocation = useRef<{latitude: number, longitude: number} | null>(null)

  // Use provided userId or fall back to the authenticated user's ID
  const effectiveUserId = userId || user?.id

  // Fetch the active request
  const fetchRequest = useCallback(async (force = false) => {
    if (!effectiveUserId) return
    
    // Throttle fetches
    const now = Date.now()
    if (!force && isFetching.current) return
    if (!force && now - lastFetchTime.current < FETCH_THROTTLE_MS) return
    
    isFetching.current = true
    setServiceRequestLoading(true)
    
    try {
      const response = await fetch('/api/service-request/active', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        cache: 'no-store'
      })
      if (!response.ok) throw new Error('Failed to fetch service request')
      
      const data = await response.json()
      if (isMounted.current) {
        // Check if location has changed
        if (data && data.mechanicLocation && previousLocation.current) {
          const newLat = data.mechanicLocation.latitude;
          const newLng = data.mechanicLocation.longitude;
          const prevLat = previousLocation.current.latitude;
          const prevLng = previousLocation.current.longitude;
          
          // Check if location has changed by at least 10 meters (approximate)
          if (Math.abs(newLat - prevLat) > 0.0001 || Math.abs(newLng - prevLng) > 0.0001) {
            console.log('Mechanic location changed:', { 
              previous: previousLocation.current, 
              new: data.mechanicLocation 
            });
            setLocationChanged(true);
          }
        }
        
        // Update previous location reference
        if (data && data.mechanicLocation) {
          previousLocation.current = {
            latitude: data.mechanicLocation.latitude,
            longitude: data.mechanicLocation.longitude
          };
        }
        
        setServiceRequest(data)
        setServiceRequestError(null)
      }
    } catch (error) {
      console.error('Error fetching service request:', error)
      if (isMounted.current) {
        setServiceRequestError(error as Error)
      }
    } finally {
      if (isMounted.current) {
        setServiceRequestLoading(false)
      }
      isFetching.current = false
      lastFetchTime.current = Date.now()
    }
  }, [effectiveUserId])

  // Add a public method to trigger a refresh
  const refreshRequest = useCallback(() => {
    fetchRequest(true);
  }, [fetchRequest]);

  // Add a method to reset the locationChanged flag
  const resetLocationChanged = useCallback(() => {
    setLocationChanged(false);
  }, []);

  // Initial fetch with authentication check
  useEffect(() => {
    const shouldFetch = effectiveUserId && !serviceRequest;
    
    if (shouldFetch) {
      fetchRequest(true);
    }
  }, [effectiveUserId, serviceRequest, fetchRequest]);

  // Set up Supabase realtime subscription
  useEffect(() => {
    if (!effectiveUserId) return;

    isMounted.current = true;
    let pollingInterval: NodeJS.Timeout | null = null;
    let debounceTimer: NodeJS.Timeout | null = null;
      
    const handleUpdate = () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => fetchRequest(false), DEBOUNCE_MS);
    };

    try {
      const channel = supabase
        .channel(`active_request_${effectiveUserId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'ServiceRequest',
            filter: `clientId=eq.${effectiveUserId}`
          },
          (payload: RealtimePostgresChangesPayload) => {
            handleUpdate();
          }
        )
        .subscribe((status: string) => {
          if (status !== 'SUBSCRIBED' && !pollingInterval) {
            pollingInterval = setInterval(() => fetchRequest(false), POLLING_INTERVAL_MS);
          }
        });

      return () => {
        isMounted.current = false;
        channel.unsubscribe();
        
        if (debounceTimer) clearTimeout(debounceTimer);
        if (pollingInterval) clearInterval(pollingInterval);
      }
    } catch (error) {
      console.error('Error setting up Supabase realtime for active request:', error);
      
      pollingInterval = setInterval(() => fetchRequest(false), POLLING_INTERVAL_MS);
      
      return () => {
        isMounted.current = false;
        if (debounceTimer) clearTimeout(debounceTimer);
        if (pollingInterval) clearInterval(pollingInterval);
      }
    }
  }, [effectiveUserId, fetchRequest]);

  return {
    serviceRequest,
    serviceRequestLoading,
    serviceRequestError,
    refetchServiceRequest: () => fetchRequest(true),
    refreshRequest,
    resetLocationChanged,
    locationChanged
  }
}

// Helper function to determine if a request status needs active monitoring
export function isActiveStatus(status: ServiceRequest['status']): boolean {
  return [
    'REQUESTED',
    'ACCEPTED',
    'PAYMENT_AUTHORIZED',
    'IN_ROUTE',
    'SERVICING',
    'IN_COMPLETION'
  ].includes(status)
}
