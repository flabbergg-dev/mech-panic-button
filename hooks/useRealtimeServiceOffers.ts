'use client'

import { useState, useEffect, useCallback } from 'react'
import { ServiceOffer, ServiceRequest, ServiceStatus } from '@prisma/client'
import { supabase } from '@/utils/supabase/client'
import { getServiceOffersForClient } from '@/app/actions/service/offer/getServiceOffersAction'
import { getServiceRequestsForClient } from '@/app/actions/getServiceRequestAction'
import { RealtimePostgresChangesPayload } from '@/types/supabase'

// Define active statuses
const ACTIVE_STATUSES = [
  ServiceStatus.REQUESTED,
  ServiceStatus.ACCEPTED,
  ServiceStatus.PAYMENT_AUTHORIZED,
  ServiceStatus.IN_ROUTE,
  ServiceStatus.SERVICING,
  ServiceStatus.IN_PROGRESS,
  ServiceStatus.IN_COMPLETION
];

// Type guard to check if a status is an active status
const isActiveStatus = (status: ServiceStatus): status is typeof ACTIVE_STATUSES[number] => {
  return ACTIVE_STATUSES.includes(status as any);
};

export function useRealtimeServiceOffers(userId: string) {
  const [offers, setOffers] = useState<any[]>([])
  const [requests, setRequests] = useState<ServiceRequest[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [lastFetchTime, setLastFetchTime] = useState<number>(0)
  const [initialLoadComplete, setInitialLoadComplete] = useState<boolean>(false)

  const fetchData = async (force = false, isInitialLoad = false) => {
    if (!userId) {
      console.log('No userId provided to useRealtimeServiceOffers');
      return { offers: [], requests: [] };
    }
    
    // Prevent excessive fetching (debounce)
    const now = Date.now();
    if (!force && now - lastFetchTime < 2000) {
      console.log('Skipping fetch - too soon since last fetch');
      return { offers, requests };
    }
    
    try {
      // Only set loading on initial load or forced refreshes
      if (isInitialLoad || force) {
        setLoading(true);
      }
      
      setLastFetchTime(now);
      console.log('Fetching data for user:', userId);
      
      const [offersData, requestsData] = await Promise.all([
        getServiceOffersForClient(userId),
        getServiceRequestsForClient(userId)
      ])

      // Filter to only keep active requests and recently completed ones
      const filteredRequests = requestsData.filter(req => {
        // Keep active requests
        if (isActiveStatus(req.status)) {
          return true;
        }
        
        // Keep recently completed requests (last 24 hours)
        if (req.status === ServiceStatus.COMPLETED) {
          const completedTime = new Date(req.updatedAt).getTime();
          const oneDayAgo = now - 24 * 60 * 60 * 1000;
          return completedTime > oneDayAgo;
        }
        
        return false;
      });

      console.log('Data fetched successfully:', {
        offersCount: offersData.length,
        requestsCount: filteredRequests.length,
        activeRequests: filteredRequests.map(r => ({ id: r.id, status: r.status }))
      });

      setOffers(offersData)
      setRequests(filteredRequests)
      setError(null)
      
      return { offers: offersData, requests: filteredRequests };
    } catch (err) {
      setError('Failed to fetch data')
      console.error('Error in useRealtimeServiceOffers:', err)
      return { offers: [], requests: [] };
    } finally {
      setLoading(false)
      if (isInitialLoad) {
        setInitialLoadComplete(true);
      }
    }
  }

  // Initial fetch
  useEffect(() => {
    if (userId) {
      console.log('Initial fetch for user in useRealtimeServiceOffers:', userId);
      fetchData(true, true);
    }
  }, [userId]);

  // Set up Supabase realtime subscriptions
  useEffect(() => {
    if (!userId) return;

    let isSubscribed = false;
    let pollingInterval: NodeJS.Timeout | null = null;
    let debounceTimer: NodeJS.Timeout | null = null;
    
    console.log('Setting up Supabase realtime subscriptions for user:', userId);

    const handleUpdate = () => {
      // Debounce updates
      if (debounceTimer) clearTimeout(debounceTimer);
      
      // Log that we're about to refresh
      console.log('Scheduling data refresh due to realtime update');
      
      // Use a shorter debounce time to make updates more responsive
      debounceTimer = setTimeout(async () => {
        console.log('Executing debounced data refresh');
        try {
          // Force refresh to ensure we get the latest data
          await fetchData(true);
        } catch (error) {
          console.error('Error in handleUpdate:', error);
        }
      }, 300);
    };

    try {
      // Create a single channel for both tables
      const channel = supabase.channel(`service_changes_${userId}`);
      
      // Subscribe to changes on the ServiceRequest table
      channel.on(
        'postgres_changes',
        {
          event: '*', // Listen for all events (insert, update, delete)
          schema: 'public',
          table: 'ServiceRequest',
          filter: `clientId=eq.${userId}` // Only listen for changes to this user's requests
        },
        (payload: RealtimePostgresChangesPayload) => {
          console.log('Realtime ServiceRequest update received:', payload);
          
          // Only refresh if this is an update to an active request or a new request
          const newStatus = payload.new?.status;
          const oldStatus = payload.old?.status;
          
          // Check if this is a relevant update that should trigger a refresh
          const isRelevantUpdate = 
            // New request created
            payload.eventType === 'INSERT' ||
            // Status changed
            (payload.eventType === 'UPDATE' && newStatus !== oldStatus) ||
            // Request deleted or cancelled
            payload.eventType === 'DELETE';
            
          if (isRelevantUpdate) {
            console.log('Relevant update detected, refreshing data');
            // If a request was deleted, immediately remove it from the local state
            if (payload.eventType === 'DELETE' && payload.old?.id) {
              setRequests(prev => prev.filter(req => req.id !== payload.old?.id));
            }
            handleUpdate();
          } else {
            console.log('Ignoring non-relevant update');
          }
        }
      );
      
      // Subscribe to changes on the ServiceOffer table
      channel.on(
        'postgres_changes',
        {
          event: '*', // Listen for all events
          schema: 'public',
          table: 'ServiceOffer'
          // We can't filter by userId here since offers are linked to requests, not directly to users
        },
        (payload: RealtimePostgresChangesPayload) => {
          console.log('Realtime ServiceOffer update received:', payload);
          
          // For offers, we need to check if the offer is for one of our active requests
          const isNewOffer = payload.eventType === 'INSERT';
          const isUpdatedOffer = payload.eventType === 'UPDATE';
          
          // Get the service request ID from the payload
          const serviceRequestId = payload.new?.serviceRequestId;
          
          // Check if this offer is for one of our active requests
          if (serviceRequestId) {
            // For new offers, check if the serviceRequestId matches any of our requests (active or not)
            // This ensures we see new offers even if we don't have the request in our local state yet
            const hasMatchingRequest = requests.some(req => req.id === serviceRequestId);
            
            // Always refresh on new offers for our requests
            if (isNewOffer && hasMatchingRequest) {
              console.log('New offer received for our request, refreshing data');
              handleUpdate();
            }
            // For updates, only refresh if it's for an active request
            else if (isUpdatedOffer && hasMatchingRequest && requests.some(req => 
              req.id === serviceRequestId && isActiveStatus(req.status)
            )) {
              console.log('Updated offer for active request, refreshing data');
              handleUpdate();
            }
            // If it's a new offer but we can't find the request, refresh anyway
            // This handles the case where the request might not be in our local state yet
            else if (isNewOffer) {
              console.log('New offer for potentially our request, refreshing data to check');
              handleUpdate();
            }
            else {
              console.log('Ignoring offer update for non-active request');
            }
          } else {
            // If we can't determine the request ID, refresh to be safe
            console.log('Unable to determine request ID for offer, refreshing data');
            handleUpdate();
          }
        }
      );
      
      // Subscribe to the channel
      channel.subscribe((status: string) => {
        console.log('Supabase subscription status:', status);
        isSubscribed = status === 'SUBSCRIBED';
        
        // If we couldn't subscribe, fall back to polling
        if (!isSubscribed && !pollingInterval) {
          console.log('Falling back to polling for service updates');
          pollingInterval = setInterval(() => fetchData(), 10000); // Poll every 10 seconds
        }
      });

      // Clean up subscription when component unmounts
      return () => {
        console.log('Cleaning up Supabase subscriptions');
        channel.unsubscribe();
        
        if (debounceTimer) clearTimeout(debounceTimer);
        if (pollingInterval) clearInterval(pollingInterval);
      }
    } catch (error) {
      console.error('Error setting up Supabase realtime:', error);
      
      // Fall back to polling if Supabase realtime setup fails
      console.log('Falling back to polling due to setup error');
      pollingInterval = setInterval(() => fetchData(), 10000); // Poll every 10 seconds
      
      return () => {
        if (debounceTimer) clearTimeout(debounceTimer);
        if (pollingInterval) clearInterval(pollingInterval);
      }
    }
  }, [userId]);

  // Refresh data when tab becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchData(true);
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, []);

  return {
    requests,
    offers,
    loading,
    error,
    refetch: () => fetchData(true),
    setRequests
  }
}
