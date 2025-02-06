'use client'

import {  getServiceOffersForClient } from '@/app/actions/service/offer/getServiceOffersAction'
import { getServiceRequestsForClient } from '@/app/actions/getServiceRequestAction'
import { useCallback, useEffect } from 'react'
import { ServiceStatus } from '@prisma/client'
import useSWR from 'swr'

const POLLING_INTERVAL = 10000 // 10 seconds

export function useServiceOffers(userId: string) {
  const fetchData = useCallback(async () => {
    if (!userId) return { requests: [], offers: [] }

    try {
      const serviceRequests = await getServiceRequestsForClient(userId)

      const activeRequest = serviceRequests.find(
        req => req.status !== ServiceStatus.COMPLETED
      )

      const offersData = activeRequest
        ? await getServiceOffersForClient(activeRequest.id)
        : []

      return { requests: serviceRequests, offers: offersData }
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch data')
    }
  }, [userId])

  const {
    data = { requests: [], offers: [] },
    error,
    isLoading,
    mutate
  } = useSWR(
    userId ? ['serviceOffers', userId] : null,
    fetchData,
    {
      refreshInterval: POLLING_INTERVAL,
      revalidateOnFocus: false,
      dedupingInterval: 5000,
      keepPreviousData: true
    }
  )

  // Pause polling when tab is not visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Pause polling
        mutate()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [mutate])

  return {
    requests: data.requests,
    offers: data.offers,
    loading: isLoading,
    error: error?.message || null,
    refetch: () => mutate()
  }
}
