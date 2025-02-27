import { useEffect, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { ServiceRequest } from '@prisma/client'

interface UseServiceRequestReturn {
  activeRequest: ServiceRequest | null
  isLoading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

export function useServiceRequest(): UseServiceRequestReturn {
  const { user } = useUser()
  const [activeRequest, setActiveRequest] = useState<ServiceRequest | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchRequest = async () => {
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
      console.log('Active request data:', {
        id: request?.id,
        status: request?.status,
        mechanicId: request?.mechanicId,
        mechanicLocation: request?.mechanicLocation
      })
      setActiveRequest(request)
      setError(null)
    } catch (err) {
      console.error('Error in useServiceRequest:', err)
      setError(err instanceof Error ? err : new Error('Failed to fetch service request'))
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch initial data
  useEffect(() => {
    fetchRequest()
  }, [user?.id])

  // Set up polling for active requests
  useEffect(() => {
    if (!activeRequest || !isActiveStatus(activeRequest.status)) {
      return
    }

    const intervalId = setInterval(fetchRequest, 5000) // Poll every 5 seconds

    return () => clearInterval(intervalId)
  }, [activeRequest?.status])

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
