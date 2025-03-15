import { useState, useEffect, useCallback, useRef } from 'react';
import { ServiceRequest, ServiceStatus } from '@prisma/client';
import { useUser } from '@clerk/nextjs';
import { getServiceRequestsAction } from '@/app/actions/service/request/getServiceRequestsAction';

// Define service request with client info
interface ServiceRequestWithClient extends ServiceRequest {
  client?: {
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string | null;
  };
}

interface UseMechanicServiceRequestsReturn {
  serviceRequests: ServiceRequestWithClient[];
  isLoading: boolean;
  error: Error | null;
  refetch: (force?: boolean) => Promise<void>;
}

// Minimum time between fetches in milliseconds
const FETCH_THROTTLE_MS = 5000;

export function useMechanicServiceRequests(): UseMechanicServiceRequestsReturn {
  const { user } = useUser();
  const [serviceRequests, setServiceRequests] = useState<ServiceRequestWithClient[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const isMounted = useRef(true);
  const lastFetchTime = useRef<number>(0);
  const isFetching = useRef<boolean>(false);

  const fetchRequests = useCallback(async (force = false) => {
    // Skip if already fetching or if not enough time has passed since last fetch
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

      // Only update state if component is still mounted
      if (isMounted.current) {
        // Transform response to match our expected type
        const transformedRequests: ServiceRequestWithClient[] = (response.serviceRequests || []).map(request => ({
          ...request,
          client: request.client ? {
            firstName: request.client.firstName,
            lastName: request.client.lastName,
            email: request.client.email,
            phoneNumber: request.client.phoneNumber
          } : undefined
        }));
        
        setServiceRequests(transformedRequests);
        setError(null);
      }

      lastFetchTime.current = Date.now();
    } catch (err) {
      console.error('Error fetching service requests:', err);
      if (isMounted.current) {
        setError(err instanceof Error ? err : new Error('Failed to fetch service requests'));
      }
    } finally {
      isFetching.current = false;
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  }, [serviceRequests.length]);

  // Initial fetch
  useEffect(() => {
    if (user) {
      void fetchRequests(true);
    }
  }, [user, fetchRequests]);

  // Cleanup
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Refresh data when tab becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void fetchRequests(true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchRequests]);

  // Periodic refresh
  useEffect(() => {
    const interval = setInterval(() => {
      if (isMounted.current) {
        void fetchRequests();
      }
    }, FETCH_THROTTLE_MS);

    return () => {
      clearInterval(interval);
    };
  }, [fetchRequests]);

  return {
    serviceRequests,
    isLoading,
    error,
    refetch: fetchRequests
  };
}
