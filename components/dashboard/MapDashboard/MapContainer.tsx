import React, { useState, useEffect, useCallback } from 'react'
import { MapDashboard } from "@/components/dashboard/MapDashboard/MapDashboard"
import { getServiceRequestByClientId } from '@/app/actions/service/request/getServiceRequestByClientId'
import type { User, ServiceRequest, ServiceStatus } from '@prisma/client'

// Constants based on optimization guidelines
const POLLING_INTERVAL = 60000; // 60 seconds as per optimization memory

type MapContainerProps = {
    user: User
}

interface MinimalServiceRequest {
    id: string;
    status: ServiceStatus;
    mechanicId?: string;
    clientId: string;
}

export const MapContainer = ({user}: MapContainerProps) => {
    const [serviceRequest, setServiceRequest] = useState<MinimalServiceRequest | null>(null)
    const [lastFetchTime, setLastFetchTime] = useState(0)

    const fetchData = useCallback(async (force = false) => {
        const now = Date.now()
        if (!force && now - lastFetchTime < 5000) { // 5-second minimum interval
            return;
        }

        try {
            const response = await getServiceRequestByClientId(user.id)
            if (response?.serviceRequest?.[0]) {
                const request = response.serviceRequest[0]
                setServiceRequest({
                    id: request.id,
                    status: request.status,
                    mechanicId: request.mechanicId || undefined,
                    clientId: request.clientId
                })
            } else {
                setServiceRequest(null)
            }
            setLastFetchTime(now)
        } catch (error) {
            console.error('Error fetching service request:', error)
            setServiceRequest(null)
        }
    }, [user.id, lastFetchTime])

    useEffect(() => {
        // Initial fetch
        void fetchData(true)

        // Set up polling with 60-second interval as per optimization memory
        const intervalId = setInterval(() => void fetchData(), POLLING_INTERVAL)

        // Cleanup on unmount
        return () => {
            clearInterval(intervalId)
        }
    }, [fetchData])

    return (
      <div className="space-y-4">
        <div className="p-4 bg-muted rounded-lg">
          {/* <h3 className="font-semibold">Service Status: {serviceStatus || 'Waiting for mechanic'}</h3> */}
        </div>
        {/* Only show the map to the customer who made the request */}
        {serviceRequest?.clientId === user.id && serviceRequest && (
            <MapDashboard serviceRequest={serviceRequest} />
        )}
        {/* {serviceStatus === "en_route" && (
          <div className="p-4 bg-primary/10 rounded-lg"> */}
            {/* TODO: Add ETA calculation */}
            {/* <p>Mechanic is on the way! Estimated arrival time:</p>
          </div>
        )} */}
        {!serviceRequest && (
            <div className="p-4 text-center">
            <h3 className="text-lg font-semibold">No active service request</h3>
            <p className="text-muted-foreground">
                Accept a service offer to see mechanic location
            </p>
            </div>
        )}
      </div>
    );
}
