"use client"

import { useEffect, useState } from "react"

import { format } from "date-fns"
import { motion } from "framer-motion"
import {
  getServiceRequestById,
  type ServiceRequestMock,
} from "@/lib/mock/serviceRequests"
import { ArrowRightIcon } from "lucide-react"
import { Button } from "../ui/button"
import { Card } from "../ui/card"
import { useMechanicNavigation } from "@/hooks/useMechanicNavigation.navigator"

export const ServiceRequest = ({
  serviceRequestId,
  isScheduled,
}: {
  serviceRequestId: string
  isScheduled: boolean
}) => {
  const { goToServiceRequest } = useMechanicNavigation()
  const [requestData, setRequestData] = useState<
    ServiceRequestMock | undefined
  >()

  useEffect(() => {
    // Simulate async fetch
    const fetchData = () => {
      const data = getServiceRequestById(serviceRequestId)
      setRequestData(data)
    }
    fetchData()
  }, [serviceRequestId])

  if (!requestData) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
    >
      <button
        className="w-full"
        onClick={() => {
          // Navigate to specific id service request page
          goToServiceRequest(requestData.id.toString())
        }}
      >
        <Card className="p-4 space-y-4 bg-card">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">{requestData.clientName}</h3>
            {requestData.isScheduled && (
              <span className="text-xs font-medium text-primary px-2 py-1 bg-primary/10 rounded-full">
                Scheduled
              </span>
            )}
          </div>

          <div className="space-y-4">
            <div
              className={`flex  flex-row gap-2 ${isScheduled ? "align-baseline items-end" : "items-center"}`}
            >
              <span className="text-sm font-medium">
                <img
                  src="/icons/servicerequest.svg"
                  alt="location_ping"
                  className="dark:invert"
                />
              </span>
              <div className="flex flex-col items-start pl-2 gap-4 flex-grow">
                {!isScheduled && <span>{requestData.fromLocation}</span>}
                <span>{requestData.toLocation}</span>
              </div>
            </div>
            {requestData.isScheduled && requestData.scheduledDateTime && (
              <div className="text-sm text-muted-foreground">
                Scheduled for:{" "}
                {format(new Date(requestData.scheduledDateTime), "PPp")}
              </div>
            )}
          </div>
            <div
            className={`border bg-white rounded-full w-full flex gap-4 text-black group ${
              requestData.isScheduled
              ? "opacity-50 cursor-not-allowed"
              : "hover:bg-primary hover:text-primary-foreground"
            }`}
            // disabled={requestData.isScheduled}
            >
            {requestData.isScheduled ? "Scheduled" : "Lookup Gig"}
            <ArrowRightIcon className="hidden group-hover:block ease-in-out duration-150 group-hover:translate-x-2 -translate-x-2" />
            </div>
        </Card>
      </button>
    </motion.div>
  )
}
