'use client'

import { getServiceOffersForClient } from '@/app/actions/service/offer/getServiceOffersAction'
import { getServiceRequestsForClient } from '@/app/actions/getServiceRequestAction'
import { useState, useEffect } from 'react'
import { ServiceRequest, ServiceStatus } from '@prisma/client'

const POLLING_INTERVAL = 10000 // 10 seconds

export function useServiceOffers(userId: string) {
  const [offers, setOffers] = useState<any[]>([])
  const [requests, setRequests] = useState<ServiceRequest[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = async () => {
    try {
      setLoading(true)
      const [offersData, requestsData] = await Promise.all([
        getServiceOffersForClient(userId),
        getServiceRequestsForClient(userId)
      ])

      setOffers(offersData)
      
      // Get requests with their reviews
      const requestsWithReviews = await Promise.all(
        requestsData.map(async (request: ServiceRequest) => {
          // Include the review information
          if (request.status === ServiceStatus.COMPLETED) {
            const reviewInfo = await fetch(`/api/reviews/${request.id}`).then(res => res.json()).catch(() => null)
            return { ...request, review: reviewInfo }
          }
          return request
        })
      )
      
      setRequests(requestsWithReviews)
      setError(null)
    } catch (err) {
      setError('Failed to fetch data')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (userId) {
      fetchData()
    }
  }, [userId])

  // Pause polling when tab is not visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Pause polling
        fetchData()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  return { offers, requests, loading, error, refetch: fetchData }
}
