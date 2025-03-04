'use client'

import { useState, useEffect, useCallback } from 'react'
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

export function useRealtimeServiceRequest(userId?: string): UseRealtimeServiceRequestReturn {
  const { user } = useUser()
  const [serviceRequest, setServiceRequest] = useState<ServiceRequestWithMechanicLocation | null>(null)
  const [serviceRequestLoading, setServiceRequestLoading] = useState(true)
  const [serviceRequestError, setServiceRequestError] = useState<Error | null>(null)

  // Use provided userId or fall back to the authenticated user's ID
  const effectiveUserId = userId || user?.id

  // Fetch the active request
  const fetchRequest = async () => {
    if (!effectiveUserId) {
      console.log('No user ID available for fetching active request');
      return;
    }

    try {
      setServiceRequestLoading(true);
      console.log('Fetching active service request for user:', effectiveUserId);
      
      const response = await fetch('/api/service-request/active', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store'
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error fetching active request:', errorText);
        throw new Error(`Failed to fetch service request: ${response.status} ${errorText}`);
      }
      
      const request = await response.json();
      
      // Only log if there's a request or if the previous state had a request
      if (request || serviceRequest) {
        console.log('Active request data:', request ? {
          id: request.id,
          status: request.status,
          mechanicId: request.mechanicId,
          mechanicLocation: request.mechanicLocation
        } : 'No active request');
      }
      
      setServiceRequest(request);
      setServiceRequestError(null);
    } catch (err) {
      console.error('Error fetching active request:', err);
      setServiceRequestError(err instanceof Error ? err : new Error('Failed to fetch service request'));
    } finally {
      setServiceRequestLoading(false);
    }
  }

  // Add a public method to trigger a refresh
  const refreshRequest = () => {
    console.log('Manual refresh triggered');
    fetchRequest();
  };

  // Initial fetch with authentication check
  useEffect(() => {
    // Only fetch once when the component mounts
    const shouldFetch = effectiveUserId && !serviceRequest;
    
    if (shouldFetch) {
      console.log('Initial fetch for user:', effectiveUserId);
      fetchRequest();
    }
  }, [effectiveUserId, serviceRequest]);

  // Set up Supabase realtime subscription
  useEffect(() => {
    if (!effectiveUserId) return;

    let pollingInterval: NodeJS.Timeout | null = null;
    let debounceTimer: NodeJS.Timeout | null = null;
    
    console.log('Setting up Supabase realtime subscription for active request');
    
    const handleUpdate = () => {
      // Debounce updates
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => fetchRequest(), 500);
    };

    try {
      // Subscribe to changes on the ServiceRequest table for this user
      const channel = supabase
        .channel(`active_request_${effectiveUserId}`)
        .on(
          'postgres_changes',
          {
            event: '*', // Listen for all events
            schema: 'public',
            table: 'ServiceRequest',
            filter: `clientId=eq.${effectiveUserId}` // Only listen for this user's requests
          },
          (payload: RealtimePostgresChangesPayload) => {
            console.log('Realtime update received for active request:', payload);
            handleUpdate();
          }
        )
        .subscribe((status: string) => {
          console.log('Supabase subscription status for active request:', status);
          
          // If subscription fails, fall back to polling
          if (status !== 'SUBSCRIBED' && !pollingInterval) {
            console.log('Falling back to polling for active request updates');
            pollingInterval = setInterval(() => fetchRequest(), 10000); // Poll every 10 seconds
          }
        });

      // Clean up subscription when component unmounts
      return () => {
        console.log('Cleaning up Supabase subscription for active request');
        channel.unsubscribe();
        
        if (debounceTimer) clearTimeout(debounceTimer);
        if (pollingInterval) clearInterval(pollingInterval);
      }
    } catch (error) {
      console.error('Error setting up Supabase realtime for active request:', error);
      
      // Fall back to polling if Supabase realtime setup fails
      console.log('Falling back to polling due to setup error');
      pollingInterval = setInterval(() => fetchRequest(), 10000); // Poll every 10 seconds
      
      return () => {
        if (debounceTimer) clearTimeout(debounceTimer);
        if (pollingInterval) clearInterval(pollingInterval);
      }
    }
  }, [effectiveUserId]);

  return {
    serviceRequest,
    serviceRequestLoading,
    serviceRequestError,
    refetchServiceRequest: fetchRequest,
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
