'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useUser } from '@clerk/nextjs'
import { ServiceRequest, ServiceStatus } from '@prisma/client'
import { supabase } from '@/utils/supabase/client'
import { RealtimePostgresChangesPayload } from '@/types/supabase'

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
}

const FETCH_THROTTLE_MS = 5000; // 5 seconds between fetches
const POLLING_INTERVAL_MS = 10000; // 10 seconds between polls
const DEBOUNCE_MS = 1000; // 1 second debounce

export function useRealtimeServiceRequest(userId?: string): UseRealtimeServiceRequestReturn {
  const { user } = useUser()
  const [serviceRequest, setServiceRequest] = useState<ServiceRequestWithMechanicLocation | null>(null)
  const [serviceRequestLoading, setServiceRequestLoading] = useState(false)
  const [serviceRequestError, setServiceRequestError] = useState<Error | null>(null)
  
  const lastFetchTime = useRef<number>(0)
  const isFetching = useRef<boolean>(false)
  const isMounted = useRef<boolean>(true)

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
      const response = await fetch(`/api/service-request/active`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        cache: 'no-store'
      })
      if (!response.ok) throw new Error('Failed to fetch service request')
      
      const data = await response.json()
      if (isMounted.current) {
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
    console.log('Manual refresh triggered');
    fetchRequest(true);
  }, [fetchRequest]);

  // Initial fetch with authentication check
  useEffect(() => {
    const shouldFetch = effectiveUserId && !serviceRequest;
    
    if (shouldFetch) {
      console.log('Initial fetch for user:', effectiveUserId);
      fetchRequest(true);
    }
  }, [effectiveUserId, serviceRequest, fetchRequest]);

  // Set up Supabase realtime subscription
  useEffect(() => {
    if (!effectiveUserId) return;

    isMounted.current = true;
    let pollingInterval: NodeJS.Timeout | null = null;
    let debounceTimer: NodeJS.Timeout | null = null;
    
    console.log('Setting up Supabase realtime subscription for active request');
    
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
            console.log('Realtime update received for active request:', payload);
            handleUpdate();
          }
        )
        .subscribe((status: string) => {
          console.log('Supabase subscription status for active request:', status);
          
          if (status !== 'SUBSCRIBED' && !pollingInterval) {
            console.log('Falling back to polling for active request updates');
            pollingInterval = setInterval(() => fetchRequest(false), POLLING_INTERVAL_MS);
          }
        });

      return () => {
        console.log('Cleaning up Supabase subscription for active request');
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
    refreshRequest
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
