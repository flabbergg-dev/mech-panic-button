"use client"

import { Profile } from "@/components/profile/Profile"
import { MapDashboard } from "@/components/dashboard/MapDashboard/MapDashboard"

import { useUser } from "@clerk/nextjs"
import { useState, Suspense } from "react"
import { SkeletonBasic } from "@/components/Skeletons/SkeletonBasic"
import { ClientDashboard } from "@/components/dashboard/ClientDashboard/ClientDashboard"

export default function CustomerDashboard() {
  const { user } = useUser()
  const [activeTab, setActiveTab] = useState("home")

  if (!user) {
    return <div>Loading...</div>
  }

  const renderContent = () => {
    switch (activeTab) {
      case "home":
        return <ClientDashboard />
      case "map":
        // TODO: add map component but only show it when client has an active request
        // return <MapDashboard />
        return null
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
        return <ClientDashboard />
    }
  }

  return (
    <div className="w-full">
      {renderContent()}
    </div>
  )
}
