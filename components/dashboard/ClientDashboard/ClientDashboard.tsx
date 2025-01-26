"use client"

import { useUser } from "@clerk/nextjs"
import { RippleComp } from "@/components/Animated/RippleComp"
import { MechPanicButton } from "@/components/Buttons/MechPanicButton"

import BentoGrid from "@/components/BentoBoxes/BentoGrid"

export const ClientDashboard = () => {
  const { user } = useUser()
  return (
    <div className="h-auto md:pb-24  pb-32  px-4">
      <div className="flex items-center justify-center min-h-screen">
        <RippleComp>
          <MechPanicButton user={user} />
        </RippleComp>
      </div>
      <BentoGrid user={user} />
    </div>
  )
}
