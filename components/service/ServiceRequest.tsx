"use client"

import { useEffect, useState } from "react"
import { ServiceRequest as ServiceRequestType } from "@prisma/client"
import { motion } from "framer-motion"
import { ArrowRightIcon, MapPinIcon } from "lucide-react"
import { Button } from "../ui/button"
import { Card } from "../ui/card"
import { useMechanicNavigation } from "@/hooks/useMechanicNavigation.navigator"
import { getCityName } from "@/lib/location"


interface ServiceRequestProps {
  request: ServiceRequestType
  isScheduled: boolean
}

export const ServiceRequest = ({
  request,
  isScheduled,
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
      }
    }
    fetchCityName()
  }, [request.location])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="p-4 hover:shadow-md transition-shadow">
        <div className="space-y-4">
          <div className="flex justify-between items-start">
            <div>
              <h4 className="font-medium">{request.serviceType}</h4>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <MapPinIcon className="h-3 w-3" />
                <span>{cityName || "Loading location..."}</span>
              </div>
              <p className="text-sm text-muted-foreground mt-2">{request.description}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => goToServiceRequest(request.id)}
            >
              <ArrowRightIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  )
}
