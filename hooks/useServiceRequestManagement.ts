import { useState, useEffect, useCallback } from 'react';
import { toast } from '@/hooks/use-toast';
import { ServiceRequest, ServiceStatus } from '@prisma/client';
import { Location } from './useLocationTracking';

interface UpdateLocationResponse {
  success: boolean;
  error?: string;
}

interface UseServiceRequestManagementProps {
  requestId: string;
  onLocationUpdate?: (location: Location) => Promise<UpdateLocationResponse>;
}

export const useServiceRequestManagement = ({
  requestId,
  onLocationUpdate
}: UseServiceRequestManagementProps) => {
  const [request, setRequest] = useState<ServiceRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showRoute, setShowRoute] = useState(false);
  const [showMechanicLocation, setShowMechanicLocation] = useState(false);

  // Fetch service request data
  const fetchRequest = useCallback(async () => {
    try {
      const response = await fetch(`/api/service-requests/${requestId}`);
      if (!response.ok) throw new Error('Failed to fetch service request');
      const data = await response.json();
      setRequest(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch service request details",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [requestId]);

  // Handle request status changes
  useEffect(() => {
    if (!request?.status) return;

    const shouldShowRouteAndLocation = 
      request.status === ServiceStatus.IN_ROUTE || 
      request.status === ServiceStatus.PAYMENT_AUTHORIZED;

    if (shouldShowRouteAndLocation) {
      requestAnimationFrame(() => {
        setShowRoute(true);
        setShowMechanicLocation(true);
      });
    }
  }, [request?.status]);

  // Set up real-time subscription
  useEffect(() => {
    let subscription: any;

    const setupRealtimeSubscription = async () => {
      try {
        // Initialize your real-time subscription here (e.g., Supabase or WebSocket)
        // subscription = await supabase
        //   .from('service_requests')
        //   .on('UPDATE', payload => {
        //     setRequest(payload.new);
        //   })
        //   .subscribe();
      } catch (error) {
        console.error('Error setting up real-time subscription:', error);
      }
    };

    setupRealtimeSubscription();

    return () => {
      if (subscription) {
        // Clean up subscription
        // subscription.unsubscribe();
      }
    };
  }, [requestId]);

  // Initial fetch
  useEffect(() => {
    fetchRequest();
  }, [fetchRequest]);

  return {
    request,
    isLoading,
    showRoute,
    showMechanicLocation,
    refetchRequest: fetchRequest
  };
};
