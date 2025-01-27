import React, { useState } from "react"
import Image from "next/image"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"

import { RefreshIcon } from "@/components/icons/refresh"
import { NotificationCard } from "@/components/Notifications/NotificationCard"

export const MechanicProfile = () => {
  const [loading, setLoading] = useState(true)

  return (
    <div className="min-h-screen md:p-10 p-4">
      <div className="flex gap-4 justify-between">
        <Avatar>
          <AvatarImage src="https://github.com/shadcn.png" />
          <AvatarFallback>CN</AvatarFallback>
        </Avatar>
        <div className="bg-white rounded-full h-12 w-12"></div>
      </div>
      <div>
        <p>Tuesday, 16 May 2023</p>
        <p className="font-bold">Hello, Selina!</p>
      </div>
      <div className="bg-white rounded-2xl h-[50dvh] w-12/12 bg-[url('/images/card.png')] bg-cover pt-10 bg-no-repeat" />
      <div className="flex flex-col">
        <p className="text-start font-bold">Service Request</p>
        {loading ? (
          <div className="flex flex-col place-items-center gap-4 pt-10">
            <Image src="/images/car.svg" alt="car" width={100} height={100} />
            <p className="text-center md:text-start">
              You currently have no Service Request. Wait a moment!
            </p>
            <Button onClick={() => setLoading(!loading)}>
              <RefreshIcon />
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-4 md:py-12 py-24">
            {/* This is the NotificationCard component */}
            {["Tire Change", "Oil Change", "Battery Replacement"].map(
              (service, index) => (
                <NotificationCard
                  key={index}
                  service={service}
                  mechanicName="Javier"
                  mechanicCarModel="Toyota Rav 4 2024"
                />
              )
            )}
          </div>
        )}
      </div>
    </div>
  )
}
