import useSWR from 'swr'
import { getMechanicLocationAction, MechanicLocation } from '@/app/actions/getMechanicLocationAction'

// Fetch interval in milliseconds (5 seconds)
const LOCATION_FETCH_INTERVAL = 5000

export function useMechanicLocation(serviceRequestId: string | undefined) {
  const { data: mechanicLocation, error, mutate } = useSWR<MechanicLocation>(
    serviceRequestId ? ['mechanicLocation', serviceRequestId] : null,
    () => serviceRequestId ? getMechanicLocationAction(serviceRequestId) : null,
    {
      refreshInterval: LOCATION_FETCH_INTERVAL,
      // Only revalidate if the component is visible
      revalidateOnFocus: true,
      // Revalidate on reconnect
      revalidateOnReconnect: true,
      // Keep the previous data while fetching new data
      keepPreviousData: true,
      // Deduplicate requests within this time window
      dedupingInterval: 1000,
    }
  )

  return {
    mechanicLocation,
    error,
    isLoading: !error && !mechanicLocation,
    mutate
  }
}
