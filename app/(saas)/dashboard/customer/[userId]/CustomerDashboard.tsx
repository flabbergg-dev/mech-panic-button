"use client"

import { Profile } from "@/components/profile/Profile"
import { MapDashboard } from "@/components/dashboard/MapDashboard/MapDashboard"

import { useUser } from "@clerk/nextjs"
import { useState, Suspense } from "react"
import { SkeletonBasic } from "@/components/Skeletons/SkeletonBasic"
import { RippleComp } from "@/components/Animated/RippleComp"
import { MechPanicButton } from "@/components/Buttons/MechPanicButton"
import BentoGrid from "@/components/BentoBoxes/BentoGrid"
import { BottomNavigation } from "@/components/navigation/bottom.navigation"
import { useUserRole } from "@/hooks/use-user-role"
import SettingsPage from "@/components/dashboard/settings/Settings"

export default function CustomerDashboard() {
  const { user } = useUser()
  const [activeTab, setActiveTab] = useState("home")
  const { userRole } = useUserRole()
  if (!user) {
    return <div>Loading...</div>
  }

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
        // TODO: add map component but only show it when client has an active request
        return <MapDashboard />
        // return null
        case "settings":
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
      return <MapDashboard />
      case "settings":
      return (
      <Suspense fallback={<SkeletonBasic />}>
        <SettingsPage />
      </Suspense>
      )
      case "profile":
        return <Profile />
        // TODO: add contact
      default:
        return <CustomerDashboard />
    }
  }

  return (
    <div className="w-full">
      {renderContent()}
      <BottomNavigation
        activeTab={activeTab}
        onTabChange={setActiveTab}
        userRole={userRole!}
      />
    </div>
  )
}
