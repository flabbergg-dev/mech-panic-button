"use client"

import { useState } from "react"
import { useUser } from "@clerk/nextjs"
import { MechanicHome } from "@/components/dashboard/MechanicDashboard/MechanicHome"
import { MechanicProfile } from "@/components/dashboard/MechanicDashboard/MechanicProfile"
import { BottomNavigation } from "@/components/navigation/bottom.navigation"
import SettingsPage from "@/components/dashboard/settings/Settings"

interface MechanicDashboardProps {
  token: string | null
}

export const MechanicDashboard = () => {
  const { user } = useUser()
  const [activeTab, setActiveTab] = useState("home")

  if (!user) {
    return <div>Loading...</div>
  }

  

  const renderContent = () => {
    switch (activeTab) {
      case "home":
        return <MechanicHome />
      case "settings":
        return <SettingsPage />
      case "profile":
        return <MechanicProfile />
      case "history":
        return <div>History Component (Coming Soon)</div>
      default:
        return <MechanicHome />
    }
  }

  return (
    <div className="w-full">
      {renderContent()}
    
      <BottomNavigation 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
      />
    </div>
  )
}
