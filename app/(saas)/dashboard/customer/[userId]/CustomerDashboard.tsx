"use client"

import { Profile } from "@/components/profile/Profile"

import { useUser } from "@clerk/nextjs"
import { useState, Suspense, useEffect } from "react"
import { SkeletonBasic } from "@/components/Skeletons/SkeletonBasic"
import { MapContainer } from "@/components/dashboard/MapDashboard/MapContainer"
import { useServiceRequestStore } from "@/store/serviceRequestStore"
import { useSearchParams } from "next/navigation"
import { Loader } from "@/components/loader"
import { RippleComp } from "@/components/Animated/RippleComp"
import { MechPanicButton } from "@/components/Buttons/MechPanicButton"
import BentoGrid from "@/components/BentoBoxes/BentoGrid"
import { BottomNavigation } from "@/components/navigation/bottom.navigation"
import { useUserRole } from "@/hooks/use-user-role"
import SettingsPage from "@/components/dashboard/settings/Settings"

export default function CustomerDashboard() {
  const { user } = useUser()
  const { serviceRequests, mechanicLocation, serviceStatus } = useServiceRequestStore()
  const params = useSearchParams()
  const tab = params.get("tab")
  const payment = params.get("payment")
  const [activeTab, setActiveTab] = useState(tab || "home")
  const userRole = useUserRole()
  // Get the most recent/active service request
  if (!user) {
    return <Loader title="Loading Your Dashboard..." />
  }

  const renderContent = () => {
    switch (activeTab) {
      case "home":
        return (
          <>
            <div className="flex items-center justify-center min-h-screen">
              <RippleComp>
                <MechPanicButton user={user} setActiveTab={setActiveTab} />
              </RippleComp>
            </div>
            <BentoGrid user={user} />
          </>
        );
      case "map":
        return <MapContainer user={user} />;
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
        userRole={userRole.userRole!}
      />
    </div>
  )
}
