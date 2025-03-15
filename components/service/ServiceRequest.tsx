"use client"

import { useEffect, useState } from "react"
import type { ServiceRequest as ServiceRequestType, ServiceStatus } from "@prisma/client"
import { ArrowRightIcon, MapPinIcon, Clock } from "lucide-react"
import { Button } from "../ui/button"
import { Card } from "../ui/card"
import { useMechanicNavigation } from "@/hooks/useMechanicNavigation.navigator"
import { getCityName } from "@/lib/location"
import { Separator } from "../ui/separator"
import { formatDistanceToNow } from 'date-fns'

interface ServiceRequestProps {
  request: ServiceRequestType & {
    client?: {
      firstName: string;
      lastName: string;
    };
  };
  isScheduled: boolean;
}

export const ServiceRequest = ({
  request,
  isScheduled
}: ServiceRequestProps) => {
  const { goToServiceRequest } = useMechanicNavigation()
  const [cityName, setCityName] = useState<string>("")

  useEffect(() => {
    const fetchCityName = async () => {
      if (
        request.location &&
        typeof request.location === 'object' &&
        'latitude' in request.location &&
        'longitude' in request.location
      ) {
        const coordinates = {
          latitude: Number(request.location.latitude),
          longitude: Number(request.location.longitude)
        };
        const city = await getCityName(coordinates);
        setCityName(city);
      } else {
        setCityName("Unknown City");
      }
    }
    fetchCityName()
  }, [request.location])

  // Format service type for display
  const formatServiceType = (type: string) => {
    return type.toLowerCase()
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Format client name
  const clientName = request.client 
    ? `${request.client.firstName} ${request.client.lastName}`
    : "Anonymous";

  // Format request time
  const requestTime = formatDistanceToNow(new Date(request.createdAt), { addSuffix: true });

  return (
    <Card 
      className="p-4 hover:shadow-md transition-shadow bg-foreground text-background border-none pointer-events-auto cursor-pointer" 
      onClick={() => goToServiceRequest(request.id)}
    >
      <div className="space-y-4">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-medium">{formatServiceType(request.serviceType)}</h4>
              <span className="text-xs px-2 py-1 rounded-full bg-primary/10">
                {request.status}
              </span>
            </div>
            <div className="flex items-center gap-1 text-sm text-card mt-1">
              <MapPinIcon className="h-3 w-3" />
              <span>{cityName || "Loading City..."}</span>
            </div>
            <div className="flex items-center gap-1 text-sm text-card mt-1">
              <Clock className="h-3 w-3" />
              <span>{requestTime}</span>
            </div>
            {request.description && (
              <p className="text-sm text-card mt-2">{request.description}</p>
            )}
            <p className="text-sm font-medium mt-2">Client: {clientName}</p>
          </div>

          {!isScheduled ? (  
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                goToServiceRequest(request.id);
              }}
            >
              <ArrowRightIcon className="h-4 w-4" />
            </Button>
          ) : (
            <div className="flex items-center gap-1 text-sm text-card flex-col justify-center relative">
              {/* <Separator className="w-px min-h-[104px] bg-primary/40 absolute -left-4 -top-4 transition-all duration-300 bottom-0 " />
              <h4 className="font-medium text-lg">
                {new Date(request.scheduledTime || request.createdAt).toLocaleDateString()}
              </h4>
              <p className="text-sm text-card mt-2">
                {new Date(request.scheduledTime || request.createdAt).toLocaleTimeString()}
              </p> */}
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}
