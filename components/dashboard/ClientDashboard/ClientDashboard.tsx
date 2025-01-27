"use client"

import { useUser } from "@clerk/nextjs"
import { RippleComp } from "@/components/Animated/RippleComp"
import { MechPanicButton } from "@/components/Buttons/MechPanicButton"

import BentoGrid from "@/components/BentoBoxes/BentoGrid"
import { BottomNavigation } from "@/components/navigation/bottom.navigation"
import { useState } from "react"

export const ClientDashboard = () => {
  const { user } = useUser()
  const [activeTab, setActiveTab] = useState("home")

  const renderContent = () => {
    switch (activeTab) {
      case "home":
        return (
          <>
            <div className="flex items-center justify-center min-h-screen">
              <RippleComp>
                <MechPanicButton user={user} />
              </RippleComp>
            </div>
            <BentoGrid user={user} />
          </>
        )
      case "map":
        return <div>Map Component (Coming Soon)</div>
      case "settings":
        return <div>Settings Component (Coming Soon)</div>
      case "profile":
        return <div>Profile Component (Coming Soon)</div>
      default:
        return null
    }
  }

  return (
    <div className="w-full">
      <div className="h-auto md:pb-24 pb-32 px-4">
        {renderContent()}
      </div>
      <BottomNavigation 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
        userRole="Customer"
      />
    </div>
  )
}
