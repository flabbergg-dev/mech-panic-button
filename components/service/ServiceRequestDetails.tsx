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
import { getServiceRequestAction } from "@/app/actions/getServiceRequestAction"
import { useToast } from "@/hooks/use-toast"

interface ServiceRequestDetailsProps {
  mechanicId: string
  requestId: string
}

type ServiceRequestWithClient = ServiceRequest & {
  client: User
}

export function ServiceRequestDetails({ mechanicId, requestId }: ServiceRequestDetailsProps) {
  const [request, setRequest] = useState<ServiceRequestWithClient | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [price, setPrice] = useState<string>("")
  const [note, setNote] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [mechanicLocation, setMechanicLocation] = useState<{latitude: number; longitude: number} | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    const fetchRequest = async () => {
      try {
        const result = await getServiceRequestAction(requestId)
        if (result.success) {
          setRequest(result.data)
        } else {
          toast({
            title: "Error",
            description: result.error,
            variant: "destructive"
          })
        }
      } catch (error) {
        console.error("Error fetching request:", error)
        toast({
          title: "Error",
          description: "Failed to load service request",
          variant: "destructive"
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchRequest()
  }, [requestId, toast])

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
          toast({
            title: "Location Error",
            description: "Unable to get your location. Please enable location services.",
            variant: "destructive"
          })
        }
      )
    }
  }, [toast])

  if (isLoading || !request) return <div>Loading...</div>

  const coordinates = request.location && typeof request.location === 'object' && 'latitude' in request.location
    ? {
        latitude: Number(request.location.latitude),
        longitude: Number(request.location.longitude)
      }
    : null

  const handleServiceOffer = async () => {
    if (!request || !price || !mechanicLocation) {
      toast({
        title: "Error",
        description: "Please fill in all required fields and enable location services",
        variant: "destructive"
      })
      return
    }

    try {
      setIsSubmitting(true)
      const result = await createServiceOfferAction({
        mechanicId: mechanicId,
        serviceRequestId: request.id,
        price: parseFloat(price),
        note: note || undefined,
        location: {
          latitude: mechanicLocation.latitude,
          longitude: mechanicLocation.longitude
        },
        expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes from now
      })

      if (result.success) {
        toast({
          title: "Success",
          description: "Service offer submitted successfully",
        })
        // Optionally redirect or update UI
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to submit offer",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error creating service offer:", error)
      toast({
        title: "Error",
        description: "Failed to submit offer",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="relative h-screen">
      {coordinates && (
        <MapboxMapComp
          userCords={coordinates}
        />
      )}

      <HalfSheet>
        <div className="p-4 space-y-6">
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

          {request?.description && (
            <div className="space-y-2">
              <h3 className="font-medium">Problem Description</h3>
              <p className="text-gray-600">{request.description}</p>
            </div>
          )}

          <div className="flex gap-4">
            <Button variant="outline" className="flex-1" onClick={() => window.history.back()}>
              Cancel
            </Button>
            <Button 
              className="flex-1"
              onClick={handleServiceOffer}
              disabled={isSubmitting || !price || !mechanicLocation}
            >
              {isSubmitting ? "Submitting..." : "Submit Offer"}
            </Button>
          </div>
        </div>
      </HalfSheet>
    </div>
  )
}
