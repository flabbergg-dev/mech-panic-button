'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { ServiceOffer } from '@prisma/client';
import { supabase } from '@/utils/supabase/client';
import type { RealtimePostgresChangesPayload } from '@/types/supabase';

export interface EnrichedServiceOffer extends ServiceOffer {
  mechanic?: {
    id: string;
    rating?: number;
    user?: {
      firstName: string;
      lastName: string;
      stripeCustomerId: string | null;
    };
  };
}

interface UseServiceOffersReturn {
  offers: EnrichedServiceOffer[];
  isLoading: boolean;
  error: Error | null;
  acceptOffer: (offerId: string) => Promise<void>;
  refreshOffers: () => Promise<void>;
}

const FETCH_THROTTLE_MS = 5000; // 5 seconds between fetches

export function useServiceOffers(serviceRequestId: string): UseServiceOffersReturn {
  const [offers, setOffers] = useState<EnrichedServiceOffer[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const isMounted = useRef(true);
  const lastFetchTime = useRef<number>(0);
  const isFetching = useRef<boolean>(false);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchOffers = useCallback(async (force = false) => {
    if (!serviceRequestId || isFetching.current || (!force && Date.now() - lastFetchTime.current < FETCH_THROTTLE_MS)) {
      return;
    }

    try {
      isFetching.current = true;
      
      // Only show loading on initial fetch
      if (offers.length === 0) {
        setIsLoading(true);
      }

      const response = await fetch(`/api/service-request/${serviceRequestId}/offers`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch offers');
      }

      const data = await response.json();
      
      if (isMounted.current) {
        setOffers(data);
        setError(null);
        lastFetchTime.current = Date.now();
      }
    } catch (err) {
      console.error('Error fetching offers:', err);
      if (isMounted.current) {
        setError(err instanceof Error ? err : new Error('Failed to fetch offers'));
      }
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
      isFetching.current = false;
    }
  }, [serviceRequestId, offers.length]);

  const acceptOffer = useCallback(async (offerId: string) => {
    if (!serviceRequestId || !offerId) return;

    try {
      setIsLoading(true);

      // Start a transaction to accept one offer and reject others
      const response = await fetch(`/api/service-request/${serviceRequestId}/accept-offer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ offerId })
      });

      if (!response.ok) {
        throw new Error('Failed to accept offer');
      }

      // Fetch updated offers after acceptance
      await fetchOffers(true);
    } catch (err) {
      console.error('Error accepting offer:', err);
      setError(err instanceof Error ? err : new Error('Failed to accept offer'));
    } finally {
      setIsLoading(false);
    }
  }, [serviceRequestId, fetchOffers]);

  // Set up Supabase real-time subscription
  useEffect(() => {
    if (!serviceRequestId) return;

    isMounted.current = true;

    const subscription = supabase
      .channel(`service_offers_${serviceRequestId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ServiceOffer',
          filter: `serviceRequestId=eq.${serviceRequestId}`
        },
        (payload: RealtimePostgresChangesPayload) => {
          void fetchOffers(true);
        }
      )
      .subscribe((status: string) => {
        if (status !== 'SUBSCRIBED' && !pollingIntervalRef.current && isMounted.current) {
          // Use 5-second interval as per optimization memory
          pollingIntervalRef.current = setInterval(() => {
            void fetchOffers(false);
          }, FETCH_THROTTLE_MS);
        }
      });

    // Initial fetch
    void fetchOffers(true);

    return () => {
      isMounted.current = false;
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      void subscription.unsubscribe();
    };
  }, [serviceRequestId, fetchOffers]);

  const refreshOffers = useCallback(() => {
    return fetchOffers(true);
  }, [fetchOffers]);

  return {
    offers,
    isLoading,
    error,
    acceptOffer,
    refreshOffers
  };
}
