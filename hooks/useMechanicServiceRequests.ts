'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useUser } from '@clerk/nextjs';
import { ServiceRequest, ServiceStatus } from '@prisma/client';
import { supabase } from '@/utils/supabase/client';
import { RealtimePostgresChangesPayload } from '@/types/supabase';
import { getServiceRequestsAction } from '@/app/actions/service/request/getServiceRequestsAction';

interface ServiceRequestClient {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string | null;
}

interface ServiceRequestWithClient extends Omit<ServiceRequest, 'client'> {
  client: ServiceRequestClient;
}

interface UseMechanicServiceRequestsReturn {
  serviceRequests: ServiceRequestWithClient[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

const FETCH_THROTTLE_MS = 5000; // 5 seconds between fetches

export function useMechanicServiceRequests(): UseMechanicServiceRequestsReturn {
  const { user } = useUser();
  const [serviceRequests, setServiceRequests] = useState<ServiceRequestWithClient[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const isMounted = useRef(true);
  const lastFetchTime = useRef<number>(0);
  const isFetching = useRef<boolean>(false);

  const fetchRequests = useCallback(async (force = false) => {
    if (isFetching.current || (!force && Date.now() - lastFetchTime.current < FETCH_THROTTLE_MS)) {
      return;
    }

    try {
      isFetching.current = true;
      
      if (serviceRequests.length === 0) {
        setIsLoading(true);
      }

      const response = await getServiceRequestsAction();
      
      if (!response) {
        throw new Error('Failed to fetch service requests');
      }

      if (response.error) {
        throw new Error(response.error);
      }

      if (isMounted.current) {
        // Transform the response to match our expected type
        const transformedRequests = response.serviceRequests.map(request => ({
          ...request,
          client: {
            ...request.client,
            name: `${request.client.firstName} ${request.client.lastName}`.trim()
          }
        }));
        setServiceRequests(transformedRequests);
        setError(null);
        lastFetchTime.current = Date.now();
      }
    } catch (err) {
      console.error('Error fetching service requests:', err);
      if (isMounted.current) {
        setError(err instanceof Error ? err : new Error('Failed to fetch service requests'));
      }
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
      isFetching.current = false;
    }
  }, [serviceRequests.length]);

  useEffect(() => {
    isMounted.current = true;
    let pollingInterval: NodeJS.Timeout;

    if (user?.id) {
      console.log('Initial service requests fetch for mechanic:', user.id);
      fetchRequests(true);
    }

    pollingInterval = setInterval(() => {
      fetchRequests(false);
    }, FETCH_THROTTLE_MS);

    return () => {
      isMounted.current = false;
      clearInterval(pollingInterval);
    };
  }, [user?.id, fetchRequests]);

  useEffect(() => {
    if (!user?.id) return;

    let pollingInterval: NodeJS.Timeout | null = null;

    console.log('Setting up Supabase realtime subscription for service requests');

    const handleUpdate = () => {
      if (isFetching.current) return;
      fetchRequests(true);
    };

    try {
      const channel = supabase
        .channel(`service_requests_${user.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'ServiceRequest',
            filter: `status=eq.REQUESTED`
          },
          (payload: RealtimePostgresChangesPayload) => {
            console.log('Realtime update received for service requests:', payload);
            handleUpdate();
          }
        )
        .subscribe((status: string) => {
          console.log('Supabase subscription status for service requests:', status);

          if (status !== 'SUBSCRIBED' && !pollingInterval) {
            console.log('Falling back to polling for service request updates');
            pollingInterval = setInterval(() => fetchRequests(false), FETCH_THROTTLE_MS);
          }
        });

      return () => {
        console.log('Cleaning up Supabase subscription for service requests');
        channel.unsubscribe();
        if (pollingInterval) clearInterval(pollingInterval);
      };
    } catch (error) {
      console.error('Error setting up Supabase realtime for service requests:', error);
      pollingInterval = setInterval(() => fetchRequests(false), FETCH_THROTTLE_MS);

      return () => {
        if (pollingInterval) clearInterval(pollingInterval);
      };
    }
  }, [user?.id, fetchRequests]);

  const refetch = useCallback(() => {
    fetchRequests(true);
  }, [fetchRequests]);

  return {
    serviceRequests,
    isLoading,
    error,
    refetch
  };
}
