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
import { updateMechanicLocation } from "@/app/actions/updateMechanicLocation"
import { updateUserCurrentLocation } from "@/app/actions/user/update-user-current-location"
import { deleteServiceOfferAction } from "@/app/actions/service/offer/deleteServiceOfferAction"
import { useEmailNotification } from "@/hooks/useEmailNotification"
import { createChatWithUserAction } from "@/app/actions/chats/create-chat-with-user.action"
import { cn } from "@/lib/utils"
import { updateOfferStatus } from "@/app/actions/updateOfferStatusAction"
import { Card } from "../ui/card"

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
  const {sendEmail} = useEmailNotification()
  const [expirationTime, setExpirationTime] = useState<string | null>(null)
  
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
        }, 1000)
      }

      if (offerResult) {
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
      } else {
        console.log("No offer result received");
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

      const subscribeServiceRequestToChannel = supabase.channel(`service_request_${requestId}`).on('postgres_changes', { event: '*', schema: 'public', table: 'ServiceRequest', filter: `id=eq.${requestId}`  }, (payload: any) => {
        console.log('Request Received payload:', payload)
        fetchData()

      }).subscribe()

      const subscribeServiceOfferToChannel = supabase.channel(`service_offer_${requestId}`).on('postgres_changes', { event: '*', schema: 'public', table: 'ServiceOffer', filter: `serviceRequestId=eq.${requestId}`  }, (payload: any) => {
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

  {useEffect(() => {

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
  }, [expirationTime, serviceOffer?.expiresAt])}
  if (isLoading || !request) return <Loader title="Loading Request..." />
  if (isRedirecting) return <Loader title="Redirecting to dashboard..." />

  if (request.status === "COMPLETED") {
    setTimeout(() => {
      router.push(`/dashboard`)
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
        const offerResult = await getMechanicServiceOfferAction(mechanicId, requestId);
        console.log("Offer result:", offerResult);

        if (!offerResult) {
          console.log("No offer result received");
          return;
        }

        if (offerResult.success && offerResult.data) {
          setServiceOffer(offerResult.data)
          console.log("Setting offer data:", offerResult.data)
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

        console.log('response', response)
        console.log('userResponse', userResponse)

        toast({
          title: "Success",
          description: "Service offer submitted successfully",
        })
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

  const handleCancelServiceOffer = async () => {
    if (!serviceOffer) return

    try {
      const response = await deleteServiceOfferAction(serviceOffer.id)
      setTimeout(() => {
        window.history.back();
      }, 1000)
      console.log('response', response)
    } catch (error) {
      console.error("Error cancelling service offer:", error)
      toast({
        title: "Error",
        description: "Failed to cancel offer",
        variant: "destructive"
      })
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

  const goToMap = (request: ServiceRequestWithClient) => {
    if (!request.location || typeof request.location !== 'object' || !('latitude' in request.location)) {
      toast({
        title: "Error",
        description: "Location information is not available",
        variant: "destructive"
      })
      return
    } else {
      const createChat = async () => {
        try {
          await createChatWithUserAction(
            request.clientId,
            mechanicId
          );
          return null;
        } catch (error) {
          throw new Error(`Error creating chat: ${error}`);
        }
      };
      createChat();
    }


    // Navigate to the map route with the destination coordinates
    router.push(`/dashboard/mechanic/${userId}/map/${requestId}?destLat=${request.location.latitude}&destLng=${request.location.longitude}`)
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
