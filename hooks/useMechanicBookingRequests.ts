import { useState, useEffect, useCallback, useRef } from 'react';
import { useUser } from '@clerk/nextjs';
import { getBookingRequestsAction } from '@/app/actions/booking/request/getBookingRequestsAction';
import { Booking } from '@prisma/client';

interface UseMechanicBookingRequestsReturn {
  bookingRequests: Booking[];
  isLoading: boolean;
  error: Error | null;
  refetch: (force?: boolean) => Promise<void>;
}

// Minimum time between fetches in milliseconds
const FETCH_THROTTLE_MS = 5000;

export function useMechanicBookingRequests(): UseMechanicBookingRequestsReturn {
  const { user } = useUser();
  const [bookingRequests, setBookingRequests] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const isMounted = useRef(true);
  const lastFetchTime = useRef<number>(0);
  const isFetching = useRef<boolean>(false);

  const fetchRequests = useCallback(async (force = false) => {
    try {
      isFetching.current = true;
      
      if (bookingRequests.length === 0) {
        setIsLoading(true);
      }

      const response = await getBookingRequestsAction();
      console.log(response, 'response');
      if (!response) {
        throw new Error('Failed to fetch booking requests');
      }

      // Only update state if component is still mounted
      if (isMounted.current) {
        // Transform response to match our expected type
        const transformedRequests: Booking[] = (response || []).map(request => ({
          ...request,
          clientId: request.customerId,
          description: request.notes,
          paymentHoldId: null,
          paymentId: null,
          status: request.status,
          mechanic: request.mechanic
        }));
        
        setBookingRequests(transformedRequests);
        setError(null);
      }

      lastFetchTime.current = Date.now();
    } catch (err) {
      console.error('Error fetching booking requests:', err);
      if (isMounted.current) {
        setError(err instanceof Error ? err : new Error('Failed to fetch booking requests'));
      }
    } finally {
      isFetching.current = false;
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  }, [bookingRequests.length]);

  // Initial fetch
  useEffect(() => {
    if (user) {
       fetchRequests(true);
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
    bookingRequests,
    isLoading,
    error,
    refetch: fetchRequests
  };
}
