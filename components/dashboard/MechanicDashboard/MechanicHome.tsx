"use client"

import { useUser } from "@clerk/nextjs"
import { useEffect, useState } from "react"
import { Loader, UserCircle } from "lucide-react"
import { ServiceStatus } from "@prisma/client"

import { BalanceCard } from "@/components/cards/BalanceCard"
import { ServiceRequest } from "@/components/service/ServiceRequest"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { PushNotificationButton } from "../../PushNotificationButton"
import { ServiceRequest as ServiceRequestType, Booking as BookingType } from "@prisma/client"

type BookingWithService = BookingType & {
  service: ServiceRequestType
}

export const MechanicHome = () => {
  const { user } = useUser()
  const [isLoading, setIsLoading] = useState(true)
  const [serviceRequests, setServiceRequests] = useState<ServiceRequestType[]>([])
  const [scheduledBookings, setScheduledBookings] = useState<BookingWithService[]>([])

  useEffect(() => {
    const fetchData = async () => {
      try {
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

    fetchData()
  }, [])

  if (isLoading) {
    return (
      <div className="flex flex-col space-y-4 p-4 md:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h1 className="text-xl font-semibold">
            Hello,{" "}
            {user?.firstName
              ? user.firstName.concat(" ", user.lastName ?? "")
              : "there"}
            !
          </h1>
          <div className="flex items-center space-x-4">
            <PushNotificationButton />
            <Avatar>
              <AvatarImage
                src={(user?.publicMetadata["avatar"] as string) ?? ""}
                alt={user?.firstName ?? "User"}
              />
              <AvatarFallback>
                {user?.firstName?.charAt(0)}
                {user?.lastName?.charAt(0)}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
        <Separator className="bg-card/20" />
        
      </div>
    )
  }

  return (
    <div className="flex flex-col space-y-4 p-4 md:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-xl font-semibold">
          Hello,{" "}
          {user?.firstName
            ? user.firstName.concat(" ", user.lastName ?? "")
            : "there"}
          !
        </h1>
        <div className="flex items-center space-x-4">
          <PushNotificationButton />
          <Avatar>
            <AvatarImage
              src={(user?.publicMetadata["avatar"] as string) ?? ""}
              alt={user?.firstName ?? "User"}
            />
            <AvatarFallback>
              <UserCircle />
            </AvatarFallback>
          </Avatar>
        </div>
      </div>

      <BalanceCard />

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-8 space-y-4">
          <Loader className="animate-spin w-8 h-8" />
          <p className="text-sm text-muted-foreground">Loading service requests...</p>
        </div>
      ) : serviceRequests.length === 0 && scheduledBookings.length === 0 ? (
        <div className="flex flex-col items-center justify-center space-y-4 py-8">
          <img
            src="/icons/car.svg"
            alt="no_request"
            className="w-24 h-24 invert dark:invert-0"
          />
          <div className="text-center space-y-2">
            <h3 className="font-semibold">No Service Requests Available</h3>
            <p className="text-sm text-muted-foreground">
              You currently have no service requests. New requests will appear here.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {serviceRequests.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Available Requests</h3>
              <ScrollArea className="h-[calc(40vh-2rem)] w-full rounded-md">
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
  )
}
