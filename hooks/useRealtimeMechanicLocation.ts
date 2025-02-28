'use client'

import { useState, useEffect } from 'react'
import { getMechanicLocationAction, MechanicLocation } from '@/app/actions/getMechanicLocationAction'
import { supabase } from '@/utils/supabase/client'
import { RealtimePostgresChangesPayload } from '@/types/supabase'

export function useRealtimeMechanicLocation(serviceRequestId: string | undefined) {
  const [mechanicLocation, setMechanicLocation] = useState<MechanicLocation>(null)
  const [error, setError] = useState<Error | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)

  const fetchLocation = async () => {
    if (!serviceRequestId) {
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      const location = await getMechanicLocationAction(serviceRequestId)
      setMechanicLocation(location)
      setError(null)
    } catch (err) {
      console.error('Error fetching mechanic location:', err)
      setError(err instanceof Error ? err : new Error('Failed to fetch mechanic location'))
    } finally {
      setIsLoading(false)
    }
  }

  // Initial fetch
  useEffect(() => {
    if (serviceRequestId) {
      console.log('Initial fetch for mechanic location:', serviceRequestId);
      fetchLocation();
    }
  }, [serviceRequestId]); // Only depend on serviceRequestId

  // Set up Supabase realtime subscription
  useEffect(() => {
    if (!serviceRequestId) return

    let isSubscribed = false;
    let fallbackInterval: NodeJS.Timeout | null = null;

    try {
      // Subscribe to changes on the ServiceRequest table for this specific request
      const subscription = supabase
        .channel(`mechanic_location_${serviceRequestId}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE', // Only listen for updates
            schema: 'public',
            table: 'ServiceRequest',
            filter: `id=eq.${serviceRequestId}` // Only listen for changes to this specific request
          },
          (payload: RealtimePostgresChangesPayload) => {
            console.log('Realtime mechanic location update received:', payload)
            // Check if mechanicLocation was updated
            if (payload.new && 'mechanicLocation' in payload.new) {
              setMechanicLocation(payload.new.mechanicLocation as MechanicLocation)
            } else {
              // If we can't get the location directly from the payload, fetch it
              fetchLocation()
            }
          }
        )
        .subscribe((status: string) => {
          console.log('Supabase mechanic location subscription status:', status);
          isSubscribed = status === 'SUBSCRIBED';
          
          // If we couldn't subscribe, fall back to polling
          if (!isSubscribed && !fallbackInterval) {
            console.log('Falling back to polling for mechanic location updates');
            fallbackInterval = setInterval(fetchLocation, 5000); // Poll every 5 seconds
          }
        });

      return () => {
        // Clean up subscription when component unmounts or serviceRequestId changes
        subscription.unsubscribe()
        
        // Clean up fallback interval if it exists
        if (fallbackInterval) {
          clearInterval(fallbackInterval);
        }
      }
    } catch (error) {
      console.error('Error setting up Supabase realtime for mechanic location:', error);
      
      // Fall back to polling if Supabase realtime setup fails
      console.log('Falling back to polling for mechanic location updates');
      fallbackInterval = setInterval(fetchLocation, 5000); // Poll every 5 seconds
      
      return () => {
        if (fallbackInterval) {
          clearInterval(fallbackInterval);
        }
      }
    }
  }, [serviceRequestId])

  return {
    mechanicLocation,
    error,
    isLoading,
    refetch: fetchLocation
  }
}
