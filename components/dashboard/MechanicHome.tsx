"use client"

import { useUser } from "@clerk/nextjs"

import { BalanceCard } from "@/components/cards/BalanceCard"
import { ServiceRequest } from "@/components/service/ServiceRequest"
import { Loader, UserCircle } from "lucide-react"
import { useEffect, useState } from "react"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { PushNotificationButton } from "../PushNotificationButton"

export const MechanicHome = () => {
  const { user } = useUser()
  const [isServiceRequestAvailable, setIsServiceRequestAvailable] = useState(false)

  useEffect(() => {
    setTimeout(() => {
      setIsServiceRequestAvailable(true)
    }, 3000)
  }, [isServiceRequestAvailable])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">
          Hello,{" "}
          {user!.firstName
            ? user!.firstName.concat(" ", user!.lastName ?? "")
            : "there"}
          !
        </h1>
        <div className="flex items-center space-x-4 flex-row ">
        <PushNotificationButton />

        <Avatar>
          <AvatarImage
            src={(user!.publicMetadata["avatar"] as string) ?? ""}
            alt={user!.firstName ?? "User"}
          />
          <AvatarFallback>
            <UserCircle />
          </AvatarFallback>
        </Avatar>
          </div>
      </div>
      
      <BalanceCard />

      {!isServiceRequestAvailable ? (
        <div className="flex flex-col items-center justify-center space-y-4">
          <h3 className="text-md font-semibold mt-6">
            No Service Requests Available
          </h3>
          <div className="space-y-4 p-4">
            <img
              src="/icons/car.svg"
              alt="no_request"
              className="invert dark:invert-0"
            />
          </div>
          <div className="space-x-4 text-center p-8">
            You currently have no <strong>Service Request</strong>. Wait a
            moment or refresh the page.
          </div>
          <div>
            <Loader className="animate-spin" />
          </div>
        </div>
      ) : (
        <div className="">
          <ScrollArea className="h-72 rounded-md ">
            <h3 className="text-md font-semibold mt-6">
              Service Requests Available
            </h3>
            <div className="space-y-4 p-4">
              <ServiceRequest serviceRequestId={"1"} isScheduled={false} />
              <ServiceRequest serviceRequestId={"2"} isScheduled={false} />
              <ServiceRequest serviceRequestId={"3"} isScheduled={false} />
              <ServiceRequest serviceRequestId={"4"} isScheduled={false} />
            </div>
          </ScrollArea>
          <Separator className="w-full whitespace-nowrap rounded-md bg-primary" />
          <h3 className="text-md font-semibold mt-6">Scheduled Appointments</h3>
          <ScrollArea className="w-full whitespace-nowrap rounded-md ">
            <div className="flex w-max space-x-4 px-4">
              <ServiceRequest serviceRequestId={"6"} isScheduled={true} />
              <ServiceRequest serviceRequestId={"7"} isScheduled={true} />
              <ServiceRequest serviceRequestId={"8"} isScheduled={true} />
              <ServiceRequest serviceRequestId={"9"} isScheduled={true} />
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>
      )}
    </div>
  )
}
