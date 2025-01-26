"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useUser } from "@clerk/nextjs"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { BalanceCard } from "@/components/cards/BalanceCard"
import { ServiceRequest } from "@/components/service/ServiceRequest"
import { Loader, UserCircle, X } from "lucide-react"

const availbale_services = [
  {
    id: 1,
    name: "Oil Change",
    client_name: "John Doe",
    location_name: "Mayaguez, PR",
    geolocation_pin: "18.2011, -67.1396",
    price: 100,
  },
  {
    id: 2,
    name: "Brake Pad Replacement",
    client_name: "Jane Marxs",
    location_name: "San Juan, PR",
    geolocation_pin: "18.4655, -66.1057",
    price: 200,
  },
  {
    id: 3,
    name: "Engine Repair",
    client_name: "Dimitri Douglass",
    location_name: "Ponce, PR",
    geolocation_pin: "18.0111, -66.6141",
    price: 300,
  },
]

const scheduled_appointments = [
  {
    id: 1,
    name: "Oil Change",
    client_name: "John Doe",
    location_name: "Mayaguez, PR",
    geolocation_pin: "18.2011, -67.1396",
    appointment_date: "2025-10-10",
    price: 100,
  },
  {
    id: 2,
    name: "Brake Pad Replacement",
    client_name: "Jane Marxs",
    location_name: "San Juan, PR",
    geolocation_pin: "18.4655, -66.1057",
    appointment_date: "2025-10-11",
    price: 200,
  },
  {
    id: 3,
    name: "Engine Repair",
    client_name: "Dimitri Douglass",
    location_name: "Ponce, PR",
    geolocation_pin: "18.0111, -66.6141",
    appointment_date: "2025-10-12",
    price: 300,
  },
]

export const MechanicDashboard = () => {
  const router = useRouter()
  const { user } = useUser()
  const [notificationPanel, setNotificationPanel] = useState(false)
  const [isServiceRequestAvailable, setIsServiceRequestAvailable] =
    useState(false)

  useEffect(() => {
    setTimeout(() => {
      setIsServiceRequestAvailable(true)
    }, 3000)
  }, [isServiceRequestAvailable])

  if (!user) {
    setTimeout(() => {
      router.push("/sign-in")
    }, 5000)
    return <div>Loading...</div>
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">
          Hello,{" "}
          {user!.firstName
            ? user!.firstName.concat(" ", user!.lastName ?? "")
            : "there"}
          !
        </h1>
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
      <BalanceCard />

      {/* fallback component if no service request is found */}
      {!isServiceRequestAvailable ? (
        <div className="flex flex-col items-center justify-center space-y-4">
          <h3 className="text-md font-semibold mt-6">
            No Service Requests Available
          </h3>
          <div className="space-y-4 p-4">
            <img
              src="/images/car.svg"
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
    </>
  )
}
