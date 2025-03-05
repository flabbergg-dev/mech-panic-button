import React, { useState, useEffect } from 'react'
import { MapDashboard } from "@/components/dashboard/MapDashboard/MapDashboard"
import { getServiceRequestByClientId } from '@/app/actions/service/request/getServiceRequestByClientId'
import { ServiceRequest } from '@prisma/client'

type MapContainerProps = {
    user: any
}

export const MapContainer = ({user}: MapContainerProps) => {
    const [serviceRequest, setServiceRequest] = useState({} as any)

    const fetchData = async () => {
        const response = await getServiceRequestByClientId(user.id)
        if (response) {
            // setServiceStatus(response.status)
            setServiceRequest(response.serviceRequest[0])
            console.log(response.serviceRequest[0]?.clientId)
        }
    }

    useEffect(() => {
        fetchData()
    }, [])

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
