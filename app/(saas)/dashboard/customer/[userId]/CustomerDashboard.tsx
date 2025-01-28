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
      return <MapDashboard />
      case "settings":
      return (
      <Suspense fallback={<SkeletonBasic />}>
        {/* TODO: add settings  for custome */}
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
      {/* <h1 className="text-3xl font-bold mb-8">Customer Dashboard</h1>
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Welcome, {user?.firstName}!</h2>
      </div> */}
      {renderContent()}
      <BottomNavigation
        activeTab={activeTab}
        onTabChange={setActiveTab}
        userRole={userRole ?? undefined}
      />
    </div>
  )
}
