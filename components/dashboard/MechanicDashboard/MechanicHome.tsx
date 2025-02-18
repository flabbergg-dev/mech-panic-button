"use client"

import { useUser } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
// import { UserCircle } from "lucide-react"
// import { ServiceStatus } from "@prisma/client"
import { getActiveMechanicOfferAction } from "@/app/actions/getActiveMechanicOfferAction"

import { BalanceCard } from "@/components/cards/BalanceCard"
import { ServiceRequest } from "@/components/service/ServiceRequest"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
// import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
// import { PushNotificationButton } from "../../PushNotificationButton"
import { ServiceRequest as ServiceRequestType, Booking as BookingType } from "@prisma/client"
import { getUserToken } from "@/app/actions/getUserToken"
import { supabase } from "@/utils/supabase/client"
import { cn } from "@/lib/utils"
import { Card } from "@/components/ui/card"
import { Loader } from "@/components/loader"
import { getStripeCustomerId } from "@/app/actions/user/get-stripe-customer-id";

type BookingWithService = BookingType & {
  service: ServiceRequestType
}

export const MechanicHome = () => {
  const { user } = useUser()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [serviceRequests, setServiceRequests] = useState<ServiceRequestType[]>([])
  const [scheduledBookings, setScheduledBookings] = useState<BookingWithService[]>([])
  const [stripeConnectId, setStripeConnectId] = useState<string | null>(null);
  const [currentAvailableBalance, setCurrentAvailableBalance] = useState(0)

  const fetchData = async () => {
    console.log("fetchData called, user:", user?.id)
    try {
      // First check for active offers
      if (!user?.id) {
        console.log("No user ID available")
        return
      }

      const activeOfferResult = await getActiveMechanicOfferAction(user.id)
      console.log("Active offer check result:", activeOfferResult)

      if (activeOfferResult.success === undefined || activeOfferResult === undefined) {
        return
      }

      if (activeOfferResult.success && activeOfferResult.data && activeOfferResult.data.length > 0) {
        // Redirect to the active offer's service request
        const redirectUrl = `/dashboard/mechanic/${user.id}/service-request/${activeOfferResult.data[0].serviceRequestId}`
        console.log("Redirecting to:", redirectUrl)
        
        try {
          // Force a hard navigation
          window.location.href = redirectUrl
        } catch (navError) {
          console.error("Navigation error:", navError)
          // Fallback to router.replace
          router.replace(redirectUrl)
        }
        return
      }

      // If no active offer, proceed with fetching service requests
      const response = await fetch('/api/service-requests?status=REQUESTED')
      const data = await response.json()
      setServiceRequests(data)

      const bookingsResponse = await fetch('/api/bookings')
      const bookingsData = await bookingsResponse.json()
      setScheduledBookings(bookingsData)
      setIsLoading(false)
    } catch (error) {
      console.error('Error fetching data:', error)
      setIsLoading(false)
    }
  }

  const fetchBalance = async () => {
    fetch(`/api/stripe/connect-balance-funds`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        destinationAccount: stripeConnectId,
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        console.log(data);
        setCurrentAvailableBalance(data.balance);
      })
      .catch((error) => {
        console.error("Error:", error);
      });
  };

  const fetchStripeConnectId = async () => {
    const response = await getStripeCustomerId()

    if (response) {
      setStripeConnectId(response.stripeCustomerId)
      console.log("Stripe Connect ID: ", response.stripeCustomerId)
    } else {
      console.error("Error fetching Stripe Connect ID")
    }
  }

  useEffect(() => {

    fetchStripeConnectId()

    if (stripeConnectId) {
      fetchBalance()
    }

    const getToken = async () => {
      const token = await getUserToken()
      if (!token) {
        console.log("No token available")
        return
      }
      supabase.realtime.setAuth(token)

      const subscribeServiceRequestToChannel = supabase.channel(`service_request`).on('postgres_changes', { event: '*', schema: 'public', table: 'ServiceRequest', }, payload => {

        console.log('Request Received payload:', payload)
        fetchData()

      }).subscribe()



      const unsubscribeFromChannels = () => {
        supabase.removeChannel(subscribeServiceRequestToChannel)
      }

      return unsubscribeFromChannels
    }

    getToken()

    fetchData()
  }, [user, router])

  
  if (!user) {
      return <Loader title="Searching on the toolbox..." />
  }

  if (isLoading) {
    return <Loader title="Looking under the hood for service requests..." />
  }

  return (
    <div className="flex flex-col space-y-4 p-4 md:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative z-10 w-full max-w-md mx-auto">
          <Card className="p-6 shadow-lg bg-card/80 backdrop-blur border border-card/10">
            <h1 className="text-2xl font-bold mb-4 text-center">
              Welcome, {user.firstName}!
            </h1>
            <p className="text-muted-foreground mb-6 text-center">
              Ready to assist today?
            </p>
          </Card>
        </div>
      </div>
      <BalanceCard currentAvailableBalance={currentAvailableBalance} />

      {serviceRequests.length === 0 && scheduledBookings.length === 0 ? (
        <div className="flex flex-col items-center justify-center space-y-4 py-8">
          <img
            src="/icons/car.svg"
            alt="no_request"
            className="w-24 h-24 invert dark:invert-0"
          />
          <div className="text-center space-y-2">
            <h3 className="font-semibold">No Service Requests Available</h3>
            <p className="text-sm text-muted-foreground">
              You currently have no service requests. New requests will appear
              here.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {serviceRequests.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Available Requests</h3>
              <ScrollArea
                className={cn(
                  "h-[80dvh]w-full rounded-md ",
                  scheduledBookings.length > 0 && "h-[calc(40vh-2rem)]"
                )}
              >
                <div className="space-y-4 pr-4">
                  {serviceRequests.map((request) => (
                    <ServiceRequest
                      key={request.id}
                      request={request}
                      isScheduled={false}
                    />
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}

          {scheduledBookings.length > 0 && (
            <div>
              <Separator className="my-6" />
              <h3 className="text-lg font-semibold mb-4">Scheduled Services</h3>
              <ScrollArea className="w-full rounded-md">
                <div className="flex space-x-4 pb-4">
                  {scheduledBookings.map((booking) => (
                    <div key={booking.id} className="min-w-[300px]">
                      <ServiceRequest
                        request={booking.service}
                        isScheduled={true}
                      />
                    </div>
                  ))}
                </div>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
