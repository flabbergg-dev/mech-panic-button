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
        return <ClientDashboard />
    }
  }

  return (
    <div className="w-full">
      <h1 className="text-3xl font-bold mb-8">Customer Dashboard</h1>
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Welcome, {user?.firstName}!</h2>
      </div>
      {renderContent()}
    </div>
  )
}
