"use client"

import { useEffect, useState } from "react"
import { ServiceRequest, User } from "@prisma/client"
import { MapboxMapComp } from "@/components/MapBox/MapboxMapComp"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { HalfSheet } from "../ui/HalfSheet"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { createServiceOfferAction } from "@/app/actions/serviceOfferAction"

interface ServiceRequestDetailsProps {
  userId: string
  requestId: string
}

type ServiceRequestWithClient = ServiceRequest & {
  client: User
}

export function ServiceRequestDetails({ userId, requestId }: ServiceRequestDetailsProps) {
  const [request, setRequest] = useState<ServiceRequestWithClient | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [price, setPrice] = useState<string>("")
  const [note, setNote] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [mechanicLocation, setMechanicLocation] = useState<{latitude: number; longitude: number}>({
    latitude: 0,
    longitude: 0
  })

  useEffect(() => {
    const fetchRequest = async () => {
      try {
        const response = await fetch(`/api/service-requests/${requestId}`)
        if (!response.ok) throw new Error("Failed to fetch request")
        const data = await response.json()
        setRequest(data)
        console.info( "Request data:", data)
        
       
      } catch (error) {
        console.error("Error fetching request:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchRequest()
  }, [requestId])

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setMechanicLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          })
        },
        (error) => {
          console.error("Error getting location:", error)
        }
      )
    }
  }, [])

  if (isLoading || !request) return <div>Loading...</div>

  const coordinates = request.location && typeof request.location === 'object' && 'latitude' in request.location
    ? {
        latitude: Number(request.location.latitude),
        longitude: Number(request.location.longitude)
      }
    : null

  return (
    <div className="relative h-screen">
      {/* Map Underlay */}
      {coordinates && (
        <MapboxMapComp
          userCords={coordinates}
        />
      )}

      {/* Service Request Details HalfSheet */}
      <HalfSheet>
        <div className="p-4 space-y-6">
          {/* Customer Info */}
          <div className="flex items-center space-x-4">
            <Avatar>
              <AvatarImage
                src={request?.client?.profileImage ?? ""}
                alt={request?.client?.firstName ?? "Customer"}
              />
              <AvatarFallback>
                {request?.client?.firstName?.charAt(0) ?? "C"}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-xl font-semibold">{request?.client?.firstName || "Customer"}</h2>
            </div>
          </div>

          {/* Service Details */}
          <div className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="price">Your Offer Price</Label>
                <Input
                  id="price"
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="Enter your price"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="note">Note (Optional)</Label>
                <Textarea
                  id="note"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Add any additional notes"
                  className="mt-1"
                />
              </div>
            </div>

            <div className="flex justify-between">
              <span>Service Type</span>
              <span className="font-medium">{request?.serviceType}</span>
            </div>
            <div className="flex justify-between">
              <span>Status</span>
              <span className="font-medium capitalize">{request?.status}</span>
            </div>
          </div>

          {/* Description */}
          {request?.description && (
            <div className="space-y-2">
              <h3 className="font-medium">Problem Description</h3>
              <p className="text-gray-600">{request.description}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4">
            <Button variant="outline" className="flex-1" onClick={() => window.history.back()}>
              Cancel
            </Button>
            <Button 
              className="flex-1"
              onClick={async () => {
                if (!request || !price) return

                try {
                  setIsSubmitting(true)
                  const result = await createServiceOfferAction({
                    mechanicId: userId,
                    serviceRequestId: request.id,
                    price: parseFloat(price),
                    note: note || undefined,
                    location: mechanicLocation,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes from now
                  })

                  if (result.success) {
                    // Handle success (e.g., show success message, redirect)
                  }
                } catch (error) {
                  console.error("Error creating service offer:", error)
                } finally {
                  setIsSubmitting(false)
                }
              }}
              disabled={isSubmitting || !price}
            >
              {isSubmitting ? "Submitting..." : "Submit Offer"}
            </Button>
          </div>
        </div>
      </HalfSheet>
    </div>
  )
}
