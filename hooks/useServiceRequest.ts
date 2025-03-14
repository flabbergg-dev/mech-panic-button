import { useEffect, useState, useCallback } from 'react'
import { useUser } from '@clerk/nextjs'
import type { ServiceRequest } from '@prisma/client'

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

interface UseServiceRequestReturn {
  activeRequest: ServiceRequestWithMechanicLocation | null
  isLoading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

export function useServiceRequest(): UseServiceRequestReturn {
  const { user } = useUser()
  const [activeRequest, setActiveRequest] = useState<ServiceRequestWithMechanicLocation | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchRequest = useCallback(async () => {
    if (!user?.id) {
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      const response = await fetch('/api/service-request/active')
      if (!response.ok) {
        throw new Error('Failed to fetch service request')
      }
      const request = await response.json()
     
      setActiveRequest(request)
      setError(null)
    } catch (err) {
      console.error('Error in useServiceRequest:', err)
      setError(err instanceof Error ? err : new Error('Failed to fetch service request'))
    } finally {
      setIsLoading(false)
    }
  }, [user?.id])

  // Fetch initial data
  useEffect(() => {
    void fetchRequest()
  }, [fetchRequest])

  // Set up polling for active requests with 5-second minimum interval
  useEffect(() => {
    if (!activeRequest || !isActiveStatus(activeRequest.status)) {
      return
    }

    // Poll every 5 seconds as per optimization memory
    const intervalId = setInterval(() => {
      void fetchRequest()
    }, 5000)

    return () => clearInterval(intervalId)
  }, [activeRequest, fetchRequest])

  return {
    activeRequest,
    isLoading,
    error,
    refetch: fetchRequest
  }
}

// Helper function to determine if a request status needs active polling
function isActiveStatus(status: ServiceRequest['status']): boolean {
  return [
    'REQUESTED',
    'ACCEPTED',
    'PAYMENT_AUTHORIZED',
    'IN_ROUTE',
    'SERVICING',
    'IN_COMPLETION'
  ].includes(status)
}
