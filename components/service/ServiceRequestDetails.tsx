"use client"

import { useEffect, useState } from "react"
import { ServiceRequest, User, ServiceOffer } from "@prisma/client"
import { MapboxMapComp } from "@/components/MapBox/MapboxMapComp"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { HalfSheet } from "../ui/HalfSheet"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { createServiceOfferAction } from "@/app/actions/serviceOfferAction"
import { getServiceRequestAction } from "@/app/actions/getServiceRequestAction"
import { getMechanicServiceOfferAction } from "@/app/actions/getMechanicServiceOfferAction"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/utils/supabase/client"
import { getUserToken } from "@/app/actions/getUserToken"
import { useParams, useRouter } from "next/navigation"
import { Loader } from "../loader"

interface ServiceRequestDetailsProps {
  mechanicId: string
  requestId: string
}

type ServiceRequestWithClient = ServiceRequest & {
  client: User
}

type ServiceOfferWithRequest = ServiceOffer & {
  serviceRequest: ServiceRequest
}

export function ServiceRequestDetails({ mechanicId, requestId }: ServiceRequestDetailsProps) {
  const params = useParams()
  const {userId} = params
  const [request, setRequest] = useState<ServiceRequestWithClient | null>(null)
  const [serviceOffer, setServiceOffer] = useState<ServiceOfferWithRequest | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRedirecting, setIsRedirecting] = useState(false)
  const [price, setPrice] = useState<string>("")
  const [note, setNote] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [mechanicLocation, setMechanicLocation] = useState<{latitude: number; longitude: number} | null>(null)
  const { toast } = useToast()
  const router = useRouter()
  
  const fetchData = async () => {
    try {
      const [requestResult, offerResult] = await Promise.all([
        getServiceRequestAction(requestId),
        getMechanicServiceOfferAction(mechanicId, requestId)
      ])

      if (requestResult.success) {
        setRequest(requestResult.data)
      } else {
        toast({
          title: "Request not found",
          description:` Request was cancelled by the client. Returning to dashboard...`,
          variant: "destructive"
        })
        setIsRedirecting(true)
        setTimeout(() => {
          router.push(`/dashboard/mechanic`)
        }, 2000)
      }

      if (offerResult.success && offerResult.data) {
        setServiceOffer(offerResult.data)
        console.log(offerResult.data)
        // If there's an existing offer, set the form values
        if (offerResult.data.price) {
          setPrice(offerResult.data.price.toString())
        }
        if (offerResult.data.note) {
          setNote(offerResult.data.note)
        }
      }
    } catch (error) {
      console.error("Error fetching data:", error)
     
    } finally {
      setIsLoading(false)
    }
  }


  useEffect(() => {
    fetchData()
    
    const getToken = async () => {
      const token = await getUserToken()
      if (!token) {
        console.log("No token available")
        return
      }
      supabase.realtime.setAuth(token)

      const subscribeServiceRequestToChannel = supabase.channel(`service_request_${requestId}`).on('postgres_changes', { event: '*', schema: 'public', table: 'ServiceRequest', filter: `id=eq.${requestId}`  }, payload => {
        console.log('Request Received payload:', payload)
        fetchData()

      }).subscribe()

      const subscribeServiceOfferToChannel = supabase.channel(`service_offer_${requestId}`).on('postgres_changes', { event: '*', schema: 'public', table: 'ServiceOffer', filter: `serviceRequestId=eq.${requestId}`  }, payload => {
        console.log('Offer Received payload:', payload)
        fetchData()

      }).subscribe()

      const unsubscribeFromChannels = () => {
        supabase.removeChannel(subscribeServiceRequestToChannel)
        supabase.removeChannel(subscribeServiceOfferToChannel)
      }

      return unsubscribeFromChannels
    }

    getToken()

  }, [requestId, mechanicId, toast])

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


  if (isLoading || !request) return <Loader title="Loading Request..." />
  if (isRedirecting) return <Loader title="Redirecting to dashboard..." />

  if (request.status === "COMPLETED") {
    setTimeout(() => {
      router.push(`/dashboard`)
    }, 2000)
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold">Service Completed</h2>
          <p className="text-muted-foreground mt-2">This service has already been completed.</p>
        </div>
      </div>
    )
  }

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
        // Fetch the updated offer to get the full details
        const offerResult = await getMechanicServiceOfferAction(mechanicId, requestId)
        if (offerResult.success && offerResult.data) {
          setServiceOffer(offerResult.data)
        }
        
        toast({
          title: "Success",
          description: "Service offer submitted successfully",
        })
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

  const getOfferStatusMessage = () => {
    if (!serviceOffer) return null

    switch (serviceOffer.status) {
      case 'PENDING':
        return "Waiting for client to accept your offer..."
      case 'DECLINED':
        return "Offer was declined by the client."
      case 'ACCEPTED':
        return `Offer accepted! ${request.status !== "ACCEPTED" && request.status !== "REQUESTED" ? "Payment authorized." : "Payment pending."}`
      case 'REJECTED':
        return "Offer was rejected by the client."
      case 'EXPIRED':
        return "Offer has expired. You can cancel the service request."
      default:
        return null
    }
  }

  const goToMap = (request: ServiceRequestWithClient) => {
    if (!request.location || typeof request.location !== 'object' || !('latitude' in request.location)) {
      toast({
        title: "Error",
        description: "Location information is not available",
        variant: "destructive"
      })
      return
    }

    // Navigate to the map route with the destination coordinates
    router.push(`/dashboard/mechanic/${userId}/map/${requestId}?destLat=${request.location.latitude}&destLng=${request.location.longitude}`)
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
            {serviceOffer ? (
              <div className="space-y-4">
                <div className={`p-4 rounded-lg  ${request.status === "PAYMENT_AUTHORIZED" ? "bg-green-950" : "bg-muted"}`}>
                  <h3 className="font-medium mb-2">Your Offer</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Price</span>
                      <span className="font-medium">${serviceOffer.price}</span>
                    </div>
                    {serviceOffer.note && (
                      <div className="mt-2">
                        <span className="text-sm text-muted-foreground">Note: {serviceOffer.note}</span>
                      </div>
                    )}
                    <div className="mt-2">
                      <span className={`text-sm font-medium  transition-colors duration-200 ${request.status === "PAYMENT_AUTHORIZED" ? "text-green-500" : "text-muted-foreground"}`}>{getOfferStatusMessage()}</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
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
            )}
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

            {/* Button to go back */}
            {serviceOffer && serviceOffer.status === 'ACCEPTED' ? (
              
           null
            ) : (
              <Button variant={serviceOffer && (serviceOffer.status === 'EXPIRED' || serviceOffer.status === 'REJECTED' || serviceOffer.status === 'DECLINED') ? "destructive" : "outline"} className={"flex-1"} onClick={() => window.history.back()}>
                Cancel
              </Button>
            )}
            {/* Button to go to map with the location of the service request */}
            {serviceOffer && serviceOffer.status === 'ACCEPTED' ? (
              <Button variant="default" className="flex-1 disabled:opacity-50 bg-green-600 disabled:bg-gray-500" onClick={() => goToMap(request)}
              disabled={request.status === 'REQUESTED' || request.status === 'ACCEPTED'  }
              >
                Go to Map
              </Button>
            ) : null}
            {/* Button if there's no offer or offer is expired */}
            {!serviceOffer ? (
              <Button 
                className="flex-1"
                onClick={handleServiceOffer}
                disabled={isSubmitting || !price || !mechanicLocation}
              >
                {isSubmitting ? "Submitting..." : "Submit Offer"}
              </Button>
            ) : null}
          </div>
        </div>
      </HalfSheet>
    </div>
  )
}
