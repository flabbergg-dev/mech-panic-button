"use client"

import { Profile } from "@/components/profile/Profile"

import { useUser } from "@clerk/nextjs"
import { useState, Suspense, useEffect } from "react"
import { SkeletonBasic } from "@/components/Skeletons/SkeletonBasic"
import { MapDashboard } from "@/components/dashboard/MapDashboard/MapDashboard"
import { useServiceRequestStore } from "@/store/serviceRequestStore"
import { useSearchParams } from "next/navigation"
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
  console.log('userRole', userRole)
  // Get the most recent/active service request
  const activeServiceRequest = serviceRequests[0]

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
        // Only show map when there's an active service request
        return activeServiceRequest ? (
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <h3 className="font-semibold">Service Status: {serviceStatus || 'Waiting for mechanic'}</h3>
            </div>
            <MapDashboard 
              serviceRequest={activeServiceRequest}
            />
            {serviceStatus === 'en_route' && (
              <div className="p-4 bg-primary/10 rounded-lg">
                <p>Mechanic is on the way! Estimated arrival time: {/* Add ETA calculation */}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="p-4 text-center">
            <h3 className="text-lg font-semibold">No active service request</h3>
            <p className="text-muted-foreground">Accept a service offer to see mechanic location</p>
          </div>
        )
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
