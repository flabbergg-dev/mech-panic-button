"use client"

import { useState, useEffect } from 'react'
import { useServiceRequests } from '@/hooks/useServiceRequests'
import { ServiceOfferCard } from '@/components/cards/ServiceOfferCard'
import { RippleComp } from "@/components/Animated/RippleComp"
import { MechPanicButton } from "@/components/Buttons/MechPanicButton"
import { BottomNavigation } from "@/components/navigation/bottom.navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2Icon } from "lucide-react"
import { useUser } from '@clerk/nextjs'
import { cancelServiceRequest } from '@/app/actions/cancelServiceRequestAction'
import { toast } from '@/hooks/use-toast'
import { motion } from 'framer-motion';

export function ClientDashboard() {
  const { user } = useUser()
  const { requests, loading, error, refetch } = useServiceRequests(user?.id || '')
  const [activeTab, setActiveTab] = useState("home")

  // Check if there's an active request (either REQUESTED or OFFERED status)
  const hasActiveRequest = requests.some(request => 
    request.status === 'REQUESTED' || request.status === 'OFFERED'
  )

  // Force requests tab if there's an active request
  useEffect(() => {
    if (hasActiveRequest) {
      setActiveTab("requests")
    }
  }, [hasActiveRequest])

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

  if (loading || !user) {
    return <div className="flex justify-center items-center h-screen">
      <Loader2Icon className="animate-spin h-8 w-8" />
    </div>
  }

  if (error) {
    return <div className="text-red-500 p-4">Error: {error}</div>
  }

  // Debug logging
  console.log('All requests:', requests)

  const offeredRequests = requests.filter(request => 
    request.status === 'OFFERED'
  )

  const activeRequests = requests.filter(request => 
    request.status === 'REQUESTED' 
  )

  // Debug logging
  console.log('Offered requests:', offeredRequests)
  console.log('Active requests:', activeRequests)

  const renderContent = () => {
    // If there's an active request, only show the requests tab
    if (hasActiveRequest && activeTab !== "requests") {
      return null
    }

    switch (activeTab) {
      case "home":
        return (
          <div className="flex items-center  min-h-screen flex-col md:flex-row space-y-6">
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
             <div className="flex items-center justify-center min-h-[400px] w-full">
              <RippleComp>
                <MechPanicButton user={user} onRequestCreated={handleRequestCreated}/>
              </RippleComp>
            </div>
          </div>
        )
      case "map":
        // return <MapComp />
        return null
      case "requests":
        return (
          <div className="space-y-6 p-4 pb-20">
            {activeRequests.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Active Request</h2>
                <div className="space-y-4">
                  {activeRequests.map((request) => (
                    <Card key={request.id} className="p-4">
                      <div className="flex justify-between items-start space-x-4">
                        <div className="space-y-2 flex-1">
                          <h3 className="font-semibold">Waiting for mechanics...</h3>
                          <p className="text-sm text-muted-foreground">Your request is being sent to nearby mechanics</p>
                        </div>
                        <motion.div whileTap={{ scale: 0.98 }}>
                          <Button 
                            variant="destructive" 
                            onClick={() => handleCancelRequest(request.id)}
                            className="transition-transform"
                          >
                            Cancel
                          </Button>
                        </motion.div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {offeredRequests.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-4">New Offers</h2>
                <div className="space-y-4">
                  {offeredRequests.map((request) => (
                    <ServiceOfferCard
                      key={request.id}
                      serviceRequestId={request.id}
                      mechanicName={
                        request.mechanic?.user 
                          ? `${request.mechanic.user.firstName} ${request.mechanic.user.lastName}`
                          : 'Unknown Mechanic'
                      }
                      mechanicRating={request.mechanic?.rating || undefined}
                      price={request.offeredPrice || 0}
                      note={request.offerNote || undefined}
                      expiresAt={request.offerExpiry || undefined}
                      onOfferHandled={refetch}
                    />
                  ))}
                </div>
              </div>
            )}

            {activeRequests.length === 0 && offeredRequests.length === 0 && (
              <div className="text-center text-muted-foreground">
                No active requests or offers
              </div>
            )}
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
          // Only allow tab changes if there's no active request or if switching to requests tab
          if (!hasActiveRequest || tab === "requests") {
            setActiveTab(tab)
          }
        }} 
        disabledTabs={hasActiveRequest ? ["home", "map"] : []}
      />
    </div>
  )
}
