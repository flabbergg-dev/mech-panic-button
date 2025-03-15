'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { type ServiceRequest, ServiceStatus, type ServiceOffer } from '@prisma/client'
import { supabase } from '@/utils/supabase/client'
import { getServiceOffersForClient } from '@/app/actions/service/offer/getServiceOffersAction'
import { getServiceRequestsForClient } from '@/app/actions/getServiceRequestAction'
import type { RealtimePostgresChangesPayload } from '@/types/supabase'
import { isEqual } from 'lodash';

// Define all service statuses for type safety
const SERVICE_STATUSES = {
  ACTIVE: [
    ServiceStatus.REQUESTED,
    ServiceStatus.ACCEPTED,
    ServiceStatus.PAYMENT_AUTHORIZED,
    ServiceStatus.IN_ROUTE,
    ServiceStatus.SERVICING,
    ServiceStatus.IN_PROGRESS,
    ServiceStatus.IN_COMPLETION
  ],
  COMPLETED: ServiceStatus.COMPLETED
} as const;

type ActiveServiceStatus = typeof SERVICE_STATUSES.ACTIVE[number];

// Type guard to check if a status is an active status
const isActiveStatus = (status: ServiceStatus): status is ActiveServiceStatus => {
  return SERVICE_STATUSES.ACTIVE.includes(status as ActiveServiceStatus);
};

// Define enriched service offer type with mechanic details
interface EnrichedServiceOffer extends Omit<ServiceOffer, 'mechanicId'> {
  mechanicId: string | null;
  mechanic?: {
    id: string;
    firstName: string;
    lastName: string;
    rating: number;
    totalReviews: number;
    profileImage?: string;
  };
}

export function useRealtimeServiceOffers(userId: string) {
  const [offers, setOffers] = useState<EnrichedServiceOffer[]>([])
  const [requests, setRequests] = useState<ServiceRequest[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastFetchTime, setLastFetchTime] = useState<number | null>(null)
  const [initialLoadComplete, setInitialLoadComplete] = useState<boolean>(false)

  // Use refs to track latest state without causing re-renders
  const offersRef = useRef(offers);
  const requestsRef = useRef(requests);
  const loadingRef = useRef(loading);

  // Update refs when state changes
  useEffect(() => {
    offersRef.current = offers;
  }, [offers]);

  useEffect(() => {
    requestsRef.current = requests;
  }, [requests]);

  useEffect(() => {
    loadingRef.current = loading;
  }, [loading]);

  const fetchOffersAndRequests = useCallback(async (force = false, isInitialLoad = false) => {
    try {
      const now = Date.now();
      
      // Respect the 5-second minimum interval from optimization memory
      if (!force && lastFetchTime && now - lastFetchTime < 5000) {
        return { offers: offersRef.current, requests: requestsRef.current };
      }

      // Only set loading on initial load or forced refreshes to prevent UI flicker
      // Use loadingRef to prevent state updates during unmounted state
      if ((isInitialLoad || force) && !loadingRef.current) {
        setLoading(true);
      }
      
      setLastFetchTime(now);
      
      // Use real-time subscriptions instead of polling when possible
      const [offersData, requestsData] = await Promise.all([
        getServiceOffersForClient(userId),
        getServiceRequestsForClient(userId)
      ]);

      // Filter to only keep active requests and recently completed ones
      const filteredRequests = requestsData.filter(req => {
        // Keep active requests
        if (isActiveStatus(req.status)) {
          return true;
        }
        
        // Keep recently completed requests (last 24 hours)
        if (req.status === SERVICE_STATUSES.COMPLETED) {
          const completedTime = new Date(req.updatedAt).getTime();
          const oneDayAgo = now - 24 * 60 * 60 * 1000;
          return completedTime > oneDayAgo;
        }
        
        return false;
      });

      // Only update state if there are actual changes
      const enrichedOffers = offersData.map(offer => ({
        ...offer,
        mechanic: offer.mechanic ? {
          id: offer.mechanic.id,
          firstName: offer.mechanic.user?.firstName || '',
          lastName: offer.mechanic.user?.lastName || '',
          rating: offer.mechanic.rating || 0,
          totalReviews: offer.mechanic.rating || 0,
          profileImage: offer.mechanic.user?.stripeCustomerId || undefined,
        } : undefined
      }));

      const hasChanges = isInitialLoad || 
        force || 
        !isEqual(enrichedOffers, offersRef.current) || 
        !isEqual(filteredRequests, requestsRef.current);

      if (hasChanges) {
        setOffers(enrichedOffers);
        setRequests(filteredRequests);
      }

      setError(null);
      return { offers: enrichedOffers, requests: filteredRequests };
    } catch (err) {
      setError('Failed to fetch data');
      console.error('Error in useRealtimeServiceOffers:', err);
      return { offers: [], requests: [] };
    } finally {
      if ((isInitialLoad || force) && loadingRef.current) {
        setLoading(false);
      }
      if (isInitialLoad && !initialLoadComplete) {
        setInitialLoadComplete(true);
      }
    }
  }, [userId, lastFetchTime, initialLoadComplete]);

  // Initial fetch
  useEffect(() => {
    let isMounted = true;
    
    if (userId && !initialLoadComplete) {
      void fetchOffersAndRequests(true, true);
    }

    return () => {
      isMounted = false;
    };
  }, [userId, fetchOffersAndRequests, initialLoadComplete]);

  // Set up Supabase realtime subscriptions with proper cleanup
  useEffect(() => {
    if (!userId || !initialLoadComplete) return;

    let isMounted = true;
    let debounceTimer: NodeJS.Timeout | null = null;
    let pollingInterval: NodeJS.Timeout | null = null;

    try {
      const channel = supabase
        .channel(`service_updates_${userId}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'ServiceRequest',
          filter: `userId=eq.${userId}`,
        }, () => {
          // Debounce updates to prevent rapid re-fetches
          if (debounceTimer) clearTimeout(debounceTimer);
          debounceTimer = setTimeout(() => {
            if (isMounted) void fetchOffersAndRequests();
          }, 1000);
        })
        .subscribe();

      return () => {
        isMounted = false;
        channel.unsubscribe();
        if (debounceTimer) clearTimeout(debounceTimer);
        if (pollingInterval) clearInterval(pollingInterval);
      };
    } catch (error) {
      console.error('Error setting up Supabase realtime:', error);
      
      // Fall back to polling if Supabase realtime setup fails
      // Use 5-second minimum interval from optimization memory
      pollingInterval = setInterval(() => {
        if (isMounted) void fetchOffersAndRequests();
      }, 5000);
      
      return () => {
        isMounted = false;
        if (debounceTimer) clearTimeout(debounceTimer);
        if (pollingInterval) clearInterval(pollingInterval);
      };
    }
  }, [userId, initialLoadComplete, fetchOffersAndRequests]);

  // Refresh data when tab becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void fetchOffersAndRequests(true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchOffersAndRequests]);

  return {
    offers,
    requests,
    loading,
    error,
    refetch: () => fetchOffersAndRequests(true)
  };
}
