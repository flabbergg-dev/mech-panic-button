"use client"

import { useEffect, useState } from "react"
import { MechanicHome } from "@/components/dashboard/MechanicDashboard/MechanicHome"
import { MechanicProfileView } from "@/components/dashboard/MechanicDashboard/MechanicProfile"
import { MechanicHistory } from "@/components/dashboard/MechanicDashboard/MechanicHistory"
import { BottomNavigation } from "@/components/navigation/bottom.navigation"
import { useSearchParams } from "next/navigation"
import SettingsPage from "@/components/dashboard/settings/Settings"

export const MechanicDashboard = () => {
  const params = useSearchParams()
  const tab = params.get("view") || "home"
  const [activeTab, setActiveTab] = useState(tab)

  useEffect(() => {
    setActiveTab(tab)
  }, [tab])

  const renderContent = () => {
    switch (activeTab) {
      case "home":
        return <MechanicHome />
      case "map":
        return <div className="p-4 font-michroma-sans text-center text-2xl text-muted-foreground ">Map Component (Only Available while on service request)</div>
      case "settings":
        return <SettingsPage />
      case "profile":
        return <MechanicProfileView />
      case "history":
        return <MechanicHistory />
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
