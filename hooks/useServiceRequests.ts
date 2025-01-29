'use client'

import { useState, useEffect } from 'react'
import { getServiceRequestsForClient, type EnrichedServiceRequest } from '@/app/actions/getServiceRequestsAction'

export function useServiceRequests(userId: string) {
  const [requests, setRequests] = useState<EnrichedServiceRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchRequests = async () => {
    try {
      const data = await getServiceRequestsForClient(userId)
      setRequests(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch requests')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRequests()

    // Poll every 5 seconds
    const interval = setInterval(fetchRequests, 5000)

    return () => clearInterval(interval)
  }, [userId])

  return { requests, loading, error, refetch: fetchRequests }
}
