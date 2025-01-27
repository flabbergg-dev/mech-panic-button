import React from "react"
import { Info, User, Wrench } from "lucide-react"

import { DynamicAvatar } from "../DynamicAvatar/DynamicAvatar"

interface NotificationCardProps {
  service: string
  mechanicName: string
  mechanicCarModel: string
}

export const NotificationCard = ({
  service,
  mechanicName,
  mechanicCarModel,
}: NotificationCardProps) => {
  return (
    <div className="bg-white inline-flex justify-between rounded-xl p-4 w-12/12 md:w-4/12 md:gap-0 gap-4 shadow-xl">
      <DynamicAvatar src="" fallbackText="CN" />
      <div>
        <div className="flex gap-2">
          <Wrench size={24} />
          <p className="font-bold">{service}</p>
        </div>
        <div className="flex gap-2">
          <User size={24} />
          <p className="font-bold">{mechanicName}</p>
        </div>
        <div className="flex gap-2">
          <Info size={24} />
          <p className="font-bold">{mechanicCarModel}</p>
        </div>
      </div>
    </div>
  )
}
