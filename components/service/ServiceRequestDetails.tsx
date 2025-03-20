"use client"

import { useEffect, useState, useCallback } from "react"
import type{ ServiceRequest, User, ServiceOffer } from "@prisma/client"
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
import { supabase } from "@/utils/supabase/client"
import { getUserToken } from "@/app/actions/getUserToken"
import { useParams, useRouter } from "next/navigation"
import { Loader } from "../loader"
import { updateMechanicLocation } from "@/app/actions/updateMechanicLocation"
import { updateUserCurrentLocation } from "@/app/actions/user/update-user-current-location"
import { deleteServiceOfferAction } from "@/app/actions/service/offer/deleteServiceOfferAction"
import { useEmailNotification } from "@/hooks/useEmailNotification"
import { createChatWithUserAction } from "@/app/actions/chats/create-chat-with-user.action"
import { cn } from "@/lib/utils"
import { updateOfferStatus } from "@/app/actions/updateOfferStatusAction"
import { Card } from "../ui/card"
import useMechanicId from "@/hooks/useMechanicId";
import { toast } from "sonner"

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
  const router = useRouter()
  const {sendEmail} = useEmailNotification()
  const [expirationTime, setExpirationTime] = useState<string | null>(null)
  const mechanicIdHook = useMechanicId()

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true)
      const [requestResult, offerResult] = await Promise.all([
        getServiceRequestAction(requestId),
        getMechanicServiceOfferAction(mechanicId, requestId)
      ])

      if (requestResult.success) {
        setRequest(requestResult.data)
      } else {
        toast.error('Request was cancelled by the client. Returning to dashboard...')
        setIsRedirecting(true)
        setTimeout(() => {
          router.push('/dashboard/mechanic')
        }, 1000)
        return
      }

      if (offerResult?.success && offerResult.data) {
        setServiceOffer(offerResult.data)
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
      toast.error('Failed to fetch request details')
    } finally {
      setIsLoading(false)
    }
  }, [requestId, mechanicId, router])

  // Set up real-time subscriptions and initial data fetch
  useEffect(() => {
    let isMounted = true
    void fetchData()
    
    const setupSubscriptions = async () => {
      const token = await getUserToken()
      if (!token || !isMounted) return

      supabase.realtime.setAuth(token)

      const subscribeServiceRequestToChannel = supabase.channel(`service_request_${requestId}`)
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'ServiceRequest', 
          filter: `id=eq.${requestId}` 
        }, () => {
          if (isMounted) void fetchData()
        })
        .subscribe()

      const subscribeServiceOfferToChannel = supabase.channel(`service_offer_${requestId}`)
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'ServiceOffer', 
          filter: `serviceRequestId=eq.${requestId}` 
        }, () => {
          if (isMounted) void fetchData()
        })
        .subscribe()

      return () => {
        if (isMounted) {
          supabase.removeChannel(subscribeServiceRequestToChannel)
          supabase.removeChannel(subscribeServiceOfferToChannel)
        }
      }
    }

    void setupSubscriptions()

    return () => {
      isMounted = false
    }
  }, [requestId, fetchData])

  // Handle geolocation with 60-second interval
  useEffect(() => {
    let isMounted = true
    let watchId: number | null = null

    if (navigator.geolocation) {
      const options = {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 60000 // 60-second interval as per optimization memory
      }

      watchId = navigator.geolocation.watchPosition(
        (position) => {
          if (isMounted) {
            setMechanicLocation({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            })
          }
        },
        (error) => {
          console.error("Error getting location:", error)
          if (isMounted) {
            toast.error("Unable to get your location. Please enable location services.")
          }
        },
        options
      )
    }

    return () => {
      isMounted = false
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId)
      }
    }
  }, [])

  useEffect(() => {

    const expiresAt = new Date(serviceOffer?.expiresAt ?? new Date())
    if (!expiresAt || !serviceOffer || serviceOffer.status === 'EXPIRED') return;
    const updateExpirationTime = () => {
      const now = new Date();
      const diff = expiresAt.getTime() - now.getTime();
      if (diff <= 0) {
        setExpirationTime('Expired');
        if(serviceOffer.status === 'PENDING') updateOfferStatus(serviceOffer.id, 'EXPIRED');
        return;
      }
      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      setExpirationTime(`Expires in ${minutes}m ${seconds}s`);
    };

    updateExpirationTime();
    const timer = setInterval(updateExpirationTime, 1000);

    return () => clearInterval(timer);
  }, [serviceOffer])

  if (isLoading || !request) return <Loader title="Loading Request..." />
  if (isRedirecting) return <Loader title="Redirecting to dashboard..." />

  if (request.status === "COMPLETED") {
    setTimeout(() => {
      router.push('/dashboard')
    }, 1000)
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
      toast.error('Please fill in all required fields and enable location services')
      return
    }

    try {
      setIsSubmitting(true)
      const result = await createServiceOfferAction({
        mechanicId: mechanicId,
        serviceRequestId: request.id,
        price: Number(price),
        note: note || undefined,
        location: {
          latitude: mechanicLocation.latitude,
          longitude: mechanicLocation.longitude
        },
        expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes from now
      })

      if (result.success) {
        // Fetch the updated offer to get the full details
        const offerResult = await getMechanicServiceOfferAction(mechanicId, requestId);

        if (!offerResult) {
          toast.error("No offer result received");
          return;
        }

        if (offerResult.success && offerResult.data) {
          setServiceOffer(offerResult.data)
          // If there's an existing offer, set the form values
          if (offerResult.data.price) {
            setPrice(offerResult.data.price.toString())
          }
          if (offerResult.data.note) {
            setNote(offerResult.data.note)
          }
        }

        // TODO: merge this function with updateCurrentMechanicLocation function location

        const response = await updateMechanicLocation(requestId, mechanicLocation)
        const userResponse = await updateUserCurrentLocation({ userId: userId as string, newLocation: {
          latitude: mechanicLocation.latitude,
          longitude: mechanicLocation.longitude
        } })

        toast.success('Service offer submitted successfully')
        try {
          sendEmail({
            to: request.client.email,
            subject: 'Service Offer Submitted',
            message: `Your service offer for ${request.serviceType} has been submitted.`,
            userName: request.client.firstName
          }).catch(error => {
            console.error('Failed to send email notification:', error);
            // Don't throw, just log the error
          });
        } catch (error) {
          console.error('Error initiating email notification:', error);
          // Continue with the flow even if email fails
        }
      } else {
        toast.error(result.error || "Failed to submit offer")
      }
    } catch (error) {
      console.error("Error creating service offer:", error)
      toast.error('Failed to submit offer')
    } finally {
      setIsSubmitting(false)
     
    }
  }

  const handleCancelServiceOffer = async () => {
    if (!serviceOffer) return

    try {
      await deleteServiceOfferAction(serviceOffer.id)
      setTimeout(() => {
        window.history.back();
      }, 1000)
      toast.success('Service offer cancelled successfully')
    } catch (error) {
      console.error("Error cancelling service offer:", error)
      toast.error('Failed to cancel offer')
    } finally {
      setIsSubmitting(false)
    }
  }

  const getOfferStatusMessage = () => {
    if (!serviceOffer) return null;

    // Check if offer is expired based on time first
    const isExpired = serviceOffer.expiresAt && new Date(serviceOffer.expiresAt) < new Date();
    if (isExpired) {
      return "Offer has expired. You can cancel the service request.";
    }

    switch (serviceOffer.status) {
      case 'PENDING':
        return "Waiting for client's response..."
      case 'ACCEPTED':
        return "Offer was accepted by the client!"
      case 'DECLINED':
        return "Offer was declined by the client."
      case 'REJECTED':
        return "Offer was rejected by the client."
      case 'EXPIRED':
        return "Offer has expired. You can cancel the service request."
      default:
        return null
    }

  }

  const goToMap = async (request: ServiceRequestWithClient) => {
    try {
      if (!mechanicIdHook.mechanicUserId) {
        toast.error('Mechanic ID is not available');
        return;
      }

      if (
        !request.location ||
        typeof request.location !== "object" ||
        !("latitude" in request.location)
      ) {
        toast.error('Location information is not available');
        return;
      }

      await createChatWithUserAction(request.clientId, mechanicIdHook.mechanicUserId);
      
      // Navigate to the map route with the destination coordinates
      router.push(`/dashboard/mechanic/${mechanicIdHook.mechanicUserId}/map/${requestId}?destLat=${request.location.latitude}&destLng=${request.location.longitude}`);
    } catch (error) {
      console.error("Error creating chat:", error);
      toast.error('Failed to create chat');
    }
  }

  return (
    <div className="relative h-screen">
      {coordinates && <MapboxMapComp userCords={coordinates} />}

      <HalfSheet >
        <Card className="p-4 space-y-6 bg-card/80 text-card-foreground">
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
              <h2 className="text-xl font-semibold">
                {request?.client?.firstName || "Customer"}
              </h2>
            </div>
          </div>

          <div className="space-y-4">
            {serviceOffer ? (
              <div className="space-y-4">
                <div
                  className={cn("p-4 rounded-lg", 
                    request.status === "PAYMENT_AUTHORIZED" ? "bg-green-950/95" : "bg-muted", 
                    (serviceOffer.status === "EXPIRED" || (serviceOffer.expiresAt && new Date(serviceOffer.expiresAt) < new Date())) ? "bg-primary/95 text-primary-foreground" : ""
                  )}
                >
                  <h3 className={cn("font-medium", (serviceOffer.status === "EXPIRED" || (serviceOffer.expiresAt && new Date(serviceOffer.expiresAt) < new Date())) ? "text-primary-foreground" : "", request.status === "PAYMENT_AUTHORIZED" ? "text-green-500" : "text-muted-foreground")}>Your Offer</h3>
                  <div className="space-y-2">
                    {serviceOffer.note && (
                      <div className="text-sm">
                        <span className="font-medium">Note: </span>
                        <span className="text-muted-foreground">
                          {serviceOffer.note}
                        </span>
                      </div>
                    )}
                    <div className="mt-2 flex justify-between gap-4">
                      <span
                        className={cn("text-sm font-medium transition-colors duration-200 flex-1",
                          request.status === "PAYMENT_AUTHORIZED" ? "text-green-500" : "text-muted-foreground",
                          (serviceOffer.status === "EXPIRED" || (serviceOffer.expiresAt && new Date(serviceOffer.expiresAt) < new Date())) ? "text-primary-foreground" : ""
                        )}
                      >
                        {getOfferStatusMessage()}
                      </span>
                      <span className={cn("text-sm font-medium transition-colors duration-200",
                        request.status === "PAYMENT_AUTHORIZED" ? "text-green-500" : "text-muted-foreground",
                        (serviceOffer.status === "EXPIRED" || (serviceOffer.expiresAt && new Date(serviceOffer.expiresAt) < new Date())) ? "text-primary-foreground" : ""
                      )}>
                        {expirationTime}
                      </span>
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
            {serviceOffer && serviceOffer.status === "ACCEPTED" ? null : (
              <Button
                variant={
                  serviceOffer &&
                  (serviceOffer.status === "EXPIRED" ||
                    serviceOffer.status === "REJECTED" ||
                    serviceOffer.status === "DECLINED" || expirationTime === 'Expired')
                    ? "destructive"
                    : "outline"
                }
                className={cn("flex-1 ", serviceOffer?.status === 'EXPIRED' ? " text-destructive-foreground" : "")}
                onClick={serviceOffer ? handleCancelServiceOffer : () => router.back()}
              >
                Cancel
              </Button>
            )}
            {/* Button to go to map with the location of the service request */}
            {serviceOffer && serviceOffer.status === "ACCEPTED" ? (
              <Button
                variant="default"
                className="flex-1 disabled:opacity-50 bg-green-600 disabled:bg-gray-500"
                onClick={() => goToMap(request)}
                disabled={
                  request.status === "REQUESTED" ||
                  request.status === "ACCEPTED"
                }
              >
{request.status === "REQUESTED"  ? "Go to Map" : null}      
{request.status === "ACCEPTED" ? "Waiting for customer to pay!" : null}  
{request.status === "PAYMENT_AUTHORIZED" ? "Go to map" : null}
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
        </Card>
      </HalfSheet>
    </div>
  );
}
