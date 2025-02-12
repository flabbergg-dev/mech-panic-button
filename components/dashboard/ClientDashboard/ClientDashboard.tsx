"use client"

import { useState, useEffect, useCallback } from 'react'
import { useServiceOffers } from '@/hooks/useServiceOffers'
import { useMechanicLocation } from '@/hooks/useMechanicLocation'
import { ServiceOfferCard } from '@/components/cards/ServiceOfferCard'
import { RippleComp } from "@/components/Animated/RippleComp"
import { MechPanicButton } from "@/components/Buttons/MechPanicButton"
import { BottomNavigation } from "@/components/navigation/bottom.navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2Icon } from "lucide-react"
import { useUser } from '@clerk/nextjs'
import { cancelServiceRequest } from '@/app/actions/cancelServiceRequestAction'
import { verifyArrivalCodeAction } from '@/app/actions/verifyArrivalCodeAction'
import { toast } from '@/hooks/use-toast'
import { motion } from 'framer-motion';
import { ServiceStatus, ServiceRequest } from '@prisma/client'
import { EnrichedServiceOffer } from '@/app/actions/getServiceOffersAction'
import RequestMap from '@/components/MapBox/RequestMap'
import { HalfSheet } from '@/components/ui/HalfSheet'
import { ServiceCardLayout } from '@/components/layouts/ServiceCard.Card.Layout'
import { PinInput } from '@/components/ui/PinInput'

export function ClientDashboard() {
  const { user } = useUser()
  const [activeTab, setActiveTab] = useState<string>("home")
  const [customerLocation, setCustomerLocation] = useState<{latitude: number; longitude: number} | null>(null)
  const [estimatedTime, setEstimatedTime] = useState<string | null>(null)
  const [isVerifyingCode, setIsVerifyingCode] = useState(false)
  
  // Get customer location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCustomerLocation({
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

  const calculateEstimatedTime = useCallback(async (mechanicLocation: {latitude: number; longitude: number} | null) => {
    if (!customerLocation?.latitude || !customerLocation?.longitude) {
      console.error('Invalid customer location coordinates')
      setEstimatedTime("N/A")
      return
    }
    if (!mechanicLocation?.latitude || !mechanicLocation?.longitude) {
      console.error('Invalid mechanic location coordinates')
      setEstimatedTime("N/A")
      return
    }

    try {
      const mechanicCoords = mechanicLocation && `${mechanicLocation.longitude},${mechanicLocation.latitude}`
      const customerCoords = customerLocation && `${customerLocation.longitude},${customerLocation.latitude}`

      const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${mechanicCoords};${customerCoords}`
      const query = await fetch(
        `${url}?access_token=${process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN}`,
        { 
          method: "GET",
          headers: {
            'Content-Type': 'application/json',
          }
        }
      )
      
      if (!query.ok) {
        throw new Error(`Mapbox API error: ${query.statusText}`)
      }

      const json = await query.json()
      
      if (json.routes?.[0]?.duration) {
        const durationMinutes = Math.round(json.routes[0].duration / 60)
        setEstimatedTime(`${durationMinutes} min`)
      } else {
        console.error('No valid route found in Mapbox response:', json)
        setEstimatedTime("N/A")
      }
    } catch (error) {
      console.error('Error calculating distance:', error)
      setEstimatedTime("N/A")
    }
  }, [customerLocation])

  const { requests, offers, loading, error, refetch } = useServiceOffers(user?.id || '')

  // Check if there's an active request
  const activeRequest = requests.find((request: ServiceRequest) => 
    request.status !== ServiceStatus.COMPLETED  
  )

  // Get mechanic's location updates when in route
  const { mechanicLocation } = useMechanicLocation(
    activeRequest?.status === ServiceStatus.IN_ROUTE ? activeRequest.id : undefined
  )

  // Update ETA when mechanic location changes
  useEffect(() => {
    if (activeRequest?.status === ServiceStatus.IN_ROUTE && mechanicLocation) {
      calculateEstimatedTime(mechanicLocation)
    }
  }, [mechanicLocation, activeRequest?.status, calculateEstimatedTime])

  // Force requests tab if there's an active request, or map tab if payment authorized
  useEffect(() => {
    if (activeRequest) {
      if (activeRequest.status === ServiceStatus.PAYMENT_AUTHORIZED || activeRequest.status === ServiceStatus.IN_PROGRESS || activeRequest.status === ServiceStatus.SERVICING || activeRequest.status === ServiceStatus.IN_ROUTE || activeRequest.status === ServiceStatus.IN_COMPLETION) {
        setActiveTab("map")
      } else if (activeRequest.status !== ServiceStatus.COMPLETED) {
        setActiveTab("requests")
      }
    }
  }, [activeRequest])

  const handleRequestCreated = () => {
    setActiveTab("requests")
    refetch() // Refresh requests after creating a new one
  }

  const handleCancelRequest = async (requestId: string) => {
    try {
      const result = await cancelServiceRequest( requestId )
      if (result.success) {
        refetch() // Refresh the requests list
        toast({
          title: 'Request cancelled successfully', 
          description: 'Your request has been cancelled',
          className: 'bg-green-500 text-white'
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to cancel request',
        variant: 'destructive'
      })
    }
  }

  const handleVerifyCode = async (code: string) => {

    if (!activeRequest) return

    try {
      setIsVerifyingCode(true)

      const result = await verifyArrivalCodeAction(activeRequest.id, code)
      
      if (!result.success) {
        toast({
          title: "Error",
          description: `Verification failed: ${result.error}`,
          variant: "destructive",
        })
        return
      }

      toast({
        title: "Success",
        description: "Service started successfully",
      })
      refetch()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to verify code",
        variant: "destructive",
      })
    } finally {
      setIsVerifyingCode(false)
    }
  }

  if (loading || !user) {
    return <div className="flex justify-center items-center h-screen ">
      <Loader2Icon className="animate-spin h-8 w-8" />
    </div>
  }

  if (error) {
    return <div className="text-red-500 p-4">Error: {error}</div>
  }

  // Debug logging
  console.log('All requests:', requests)
  console.log('Active request:', activeRequest)
  console.log('Active offers:', offers)

  const renderContent = () => {
    // Debug logging
    console.log('Current tab:', activeTab)
    console.log('Active request:', activeRequest)
    console.log('Active request status:', activeRequest?.status)

    switch (activeTab) {
      case "home":
        return (
          <div className="flex items-center  min-h-screen flex-col space-y-6">
            <div className="relative z-10 w-full max-w-md">
              <Card className="p-6 shadow-lg bg-card/80 backdrop-blur border border-card/10">
                <h1 className="text-2xl font-bold mb-4 text-center">
                  Welcome, {user.firstName}!
                </h1>
                <p className="text-gray-600 mb-6 text-center">
                  Need mechanical assistance? We're here to help!
                </p>
               
              </Card>
            </div>
             <div className="flex items-center   justify-center min-h-[400px] w-full">
              <RippleComp>
                <MechPanicButton user={user} onRequestCreated={handleRequestCreated}/>
                {/* <MechPanicButtonLogo/> */}
              </RippleComp>
            </div>
          </div>
        )
      case "map":
        console.log('Rendering map tab')
        return (
          <div className="relative min-h-screen">
            {/* Underlay Map */}
            <div className="fixed inset-0 z-0">
              <RequestMap />
            </div>
            
            {/* Content Overlay */}
            {activeRequest?.status === ServiceStatus.PAYMENT_AUTHORIZED && (
              <HalfSheet>
                <ServiceCardLayout>
                  <div className="bg-background/80 backdrop-blur-sm p-4 shadow-lg rounded-t-xl">
                    <h2 className="text-xl font-semibold mb-2">Payment Authorized</h2>
                    <p className="text-muted-foreground">
                      Waiting for mechanic to start their journey. You'll be notified when they're on their way.
                    </p>
                  </div>
                </ServiceCardLayout>
              </HalfSheet>
            )}
            {activeRequest?.status === ServiceStatus.IN_ROUTE && (
              <HalfSheet>
                <ServiceCardLayout>
                  <div className="bg-background/80 backdrop-blur-sm p-4 shadow-lg border border-border/50">
                    <h2 className="text-xl font-semibold mb-2">Mechanic on their way</h2>
                      <p className="text-muted-foreground">
                      {estimatedTime ? `Mechanic will be there in ${estimatedTime}` : 'Calculating arrival time...'}
                    </p>
                    {!mechanicLocation && (
                      <p className="text-sm text-muted-foreground mt-2">
                        Waiting for mechanic's location...
                      </p>
                      )}
                    </div>
                </ServiceCardLayout>
              </HalfSheet>
            )}
             {activeRequest?.status === ServiceStatus.IN_PROGRESS && (
               <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50">
               <div className="flex flex-col h-full p-6">
                 <div className="flex-1 flex flex-col items-center justify-center space-y-6">
                   <div className="text-center space-y-4 max-w-md">
                     <h2 className="text-2xl font-semibold">Enter Arrival Code</h2>
                     <p className="text-muted-foreground">
                       Please enter the 6-digit code provided by your mechanic to start the service
                     </p>
                     <div className="mt-8">
                       <PinInput onComplete={handleVerifyCode} />
                     </div>
                     {isVerifyingCode && (
                       <div className="flex items-center justify-center mt-4">
                         <Loader2Icon className="animate-spin h-5 w-5 mr-2" />
                         <span>Verifying code...</span>
                       </div>
                     )}
                   </div>
                 </div>
               </div>
             </div>
            ) }
            {activeRequest?.status === ServiceStatus.SERVICING && (
              <HalfSheet>
                <ServiceCardLayout>
                  <div className="bg-background/80 backdrop-blur-sm p-4 shadow-lg border border-border/50">
                    <h2 className="text-xl font-semibold ">Servicing in Progress </h2>
                    <p className="text-muted-foreground mb-2 pb-4">
                      Wait for the mechanic to complete their service
                    </p>
                    <br />
                  </div>
                </ServiceCardLayout>
              </HalfSheet>
            ) }
            {activeRequest?.status === ServiceStatus.IN_COMPLETION && (
              <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50">
                <div className="flex flex-col h-full p-6">
                  <div className="flex-1 flex flex-col items-center justify-center space-y-6">
                    <div className="text-center space-y-4 max-w-md">
                      <h2 className="text-2xl font-semibold">Service Completion Code</h2>
                      <p className="text-muted-foreground">
                        Share this code with your mechanic to confirm service completion
                      </p>
                      <div className="mt-8">
                        <div className="text-5xl font-bold tracking-[0.5em] bg-muted text-primary p-8 rounded-lg">
                          {/* TODO: Replace with Loading... */}
                          {activeRequest?.completionCode || ''}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mt-4">
                        The mechanic will input this code to mark the service as completed and receive payment
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )
      case "requests":
        return (
          <div className="relative min-h-screen">
            {/* Map Container */}
            <div className="fixed inset-0">
              <RequestMap />
            </div>
            
            {/* Content Container */}
            <div className="relative z-10 space-y-6 p-4 pb-20">
              {activeRequest && (
                <div className="bg-background/80 backdrop-blur-sm rounded-lg p-4">
                  <h2 className="text-xl font-semibold mb-4">Active Request</h2>
                  <div className="space-y-4">
                    <Card className="bg-background/90 p-4">
                      <div className="flex justify-between items-start space-x-4">
                        <div className="space-y-2 flex-1">
                          <h3 className="font-semibold">
                            {offers.length === 0 
                              ? "Waiting for mechanics..." 
                              : `${offers.length} offer${offers.length === 1 ? '' : 's'} received`}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {offers.length === 0 
                              ? "Your request is being sent to nearby mechanics"
                              : "Review the offers below"}
                          </p>
                        </div>
                        <motion.div whileTap={{ scale: 0.98 }}>
                          <Button 
                            variant="destructive" 
                            onClick={() => handleCancelRequest(activeRequest.id)}
                            className="transition-transform"
                          >
                            Cancel Request
                          </Button>
                        </motion.div>
                      </div>
                    </Card>
                  </div>
                </div>
              )}

              {offers.length > 0 && (
                <div>
                  <h2 className="text-xl font-semibold mb-4">Mechanic Offers</h2>
                  <div className="space-y-4">
                    {offers
                      .slice() // Create a copy to avoid mutating the original array
                      .map((offer: EnrichedServiceOffer) => (
                      <ServiceOfferCard
                        key={offer.id}
                        serviceRequestId={offer.serviceRequestId}
                        mechanicName={
                          offer.mechanic?.user 
                            ? `${offer.mechanic.user.firstName} ${offer.mechanic.user.lastName}`
                            : 'Unknown Mechanic'
                        }
                        mechanicRating={offer.mechanic?.rating || undefined}
                        price={offer.price || 0}
                        note={offer.note || undefined}
                        expiresAt={offer.expiresAt || undefined}
                        onOfferHandled={refetch}
                        userId={user.id}
                        mechanicLocation={offer.location || null}
                        customerLocation={customerLocation || null  }
                      />
                    ))}
                  </div>
                </div>
              )}

              {!activeRequest && offers.length === 0 && (
                <div className="text-center p-4 bg-background/80 backdrop-blur-sm rounded-lg text-muted-foreground">
                  No active requests or offers
                </div>
              )}
            </div>
          </div>
        )
      case "history":
        return <div>History Component (Coming Soon)</div>
      case "settings":
        return <div>Settings Component (Coming Soon)</div>
      case "profile":
        return <div>Profile Component (Coming Soon)</div>
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen">
      {renderContent()}
      <BottomNavigation 
        activeTab={activeTab} 
        onTabChange={tab => {
          // Allow tab changes if:
          // 1. There's no active request
          // 2. Switching to requests tab
          // 3. Switching to map tab when payment is authorized
          if (!activeRequest || 
              tab === "requests" || 
              (tab === "map" && activeRequest?.status === ServiceStatus.PAYMENT_AUTHORIZED)) {
            setActiveTab(tab)
          }
        }} 
        disabledTabs={
          activeRequest 
            ? activeRequest.status === ServiceStatus.PAYMENT_AUTHORIZED 
              ? ["home"] // Only disable home when payment authorized
              : ["home", "map"] // Disable both when in other active states
            : [] // No disabled tabs when no active request
        }
      />
    </div>
  )
}
