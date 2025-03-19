"use client"

import { useEffect, useState } from "react"
import type { Booking, BookingStatus } from "@prisma/client"
import { ArrowRightIcon, Clock } from "lucide-react"
import { Button } from "../ui/button"
import { Card } from "../ui/card"
import { useMechanicNavigation } from "@/hooks/useMechanicNavigation.navigator"
import { Separator } from "../ui/separator"

interface BookingRequestProps {
  request: Booking & {
    client?: {
      firstName: string;
      lastName: string;
      email?: string;
      phoneNumber?: string | null;
    };
  };
  isScheduled: boolean;
}

export const BookingRequest = ({
  request,
  isScheduled
}: BookingRequestProps) => {
  const { goToBookingRequest } = useMechanicNavigation()

  // Format client name
  const clientName = request.client 
    ? `${request.client.firstName} ${request.client.lastName}`
    : "Unknown Client";

  // Format date for display
  const formattedDate = request.scheduledStart
    ? new Date(request.scheduledStart).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      })
    : "Unknown Date";

  return (
    <Card className="p-4 hover:shadow-md transition-shadow">
      <div className="flex flex-col space-y-4">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-medium">{clientName}</h3>
            <p className="text-sm text-muted-foreground">
              <Clock className="inline-block h-4 w-4 mr-1" />
              {formattedDate}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => goToBookingRequest(request.id)}
            aria-label="View booking details"
          >
            <ArrowRightIcon className="h-4 w-4" />
          </Button>
        </div>

        <Separator />

        <div className="space-y-2">
          <p className="text-sm">
            <span className="font-medium">Service Type:</span> {request.notes || "Scheduled Service"}
          </p>
          <p className="text-sm">
            <span className="font-medium">Duration:</span> {
              request.scheduledStart && request.scheduledEnd 
                ? `${Math.round((new Date(request.scheduledEnd).getTime() - new Date(request.scheduledStart).getTime()) / (1000 * 60))} minutes` 
                : "Unknown"
            }
          </p>
          <p className="text-sm">
            <span className="font-medium">Price:</span> ${request.totalPrice.toFixed(2)}
          </p>
        </div>

        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => goToBookingRequest(request.id)}
          >
            View Details
          </Button>
        </div>
      </div>
    </Card>
  )
}
