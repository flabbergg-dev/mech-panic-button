'use client'

import { useState, useEffect } from 'react'
import { getMechanicLocationAction, type MechanicLocation } from '@/app/actions/getMechanicLocationAction'
import { supabase } from '@/utils/supabase/client'
import type{ RealtimePostgresChangesPayload } from '@/types/supabase'

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
    if (!serviceRequestId) return;

    let isSubscribed = false;
    let fallbackInterval: NodeJS.Timeout | null = null;

    const fetchAndSetLocation = async () => {
      try {
        const location = await getMechanicLocationAction(serviceRequestId);
        setMechanicLocation(location);
        setError(null);
      } catch (err) {
        console.error('Error fetching mechanic location:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch mechanic location'));
      }
    };

    fetchAndSetLocation();

    const subscription = supabase
      .channel(`mechanic_location_${serviceRequestId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'ServiceRequest',
          filter: `id=eq.${serviceRequestId}`
        },
        (payload: RealtimePostgresChangesPayload) => {
          if (payload.new && 'mechanicLocation' in payload.new) {
            setMechanicLocation(payload.new.mechanicLocation as MechanicLocation);
          } else {
            fetchAndSetLocation();
          }
        }
      )
      .subscribe((status: string) => {
        isSubscribed = status === 'SUBSCRIBED';
        
        if (!isSubscribed && !fallbackInterval) {
          fallbackInterval = setInterval(fetchAndSetLocation, 5000);
        }
      });

    return () => {
      subscription.unsubscribe();
      if (fallbackInterval) {
        clearInterval(fallbackInterval);
      }
    };
  }, [serviceRequestId]);

  return {
    mechanicLocation,
    error,
    isLoading,
    refetch: fetchLocation
  }
}
