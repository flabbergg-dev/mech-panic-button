"use client"

import { useCallback, useEffect, useState } from "react"
import dynamic from "next/dynamic"

const MechanicHome = dynamic(() => import("@/components/dashboard/MechanicDashboard/MechanicHome").then(mod => mod.MechanicHome), {
  loading: () => <div>Loading...</div>
})
import { MechanicProfileView } from "@/components/dashboard/MechanicDashboard/MechanicProfile"
import { MechanicHistory } from "@/components/dashboard/MechanicDashboard/MechanicHistory"
import { BottomNavigation } from "@/components/navigation/bottom.navigation"
import { useSearchParams } from "next/navigation";
import SettingsPage from "@/components/dashboard/settings/Settings"
import { getMechanicByIdAction } from "@/app/actions/mechanic/get-mechanic-by-id.action"

export const MechanicDashboard = () => {
  const params = useSearchParams()
  // get last param
  const tab = params.get("view") || "home"
  const [activeTab, setActiveTab] = useState(tab)
  const [isApproved, setIsApproved] = useState(false)

  const fetchMechanic = useCallback(async () => {
    const { mechanic } = await getMechanicByIdAction()
    if (mechanic) {
      setIsApproved(mechanic.isApproved)
    }
  }, [])

  useEffect(() => {
    fetchMechanic()
    setActiveTab(tab)
  }, [tab, fetchMechanic])

  const renderContent = () => {
    switch (activeTab) {
      case "home":
        return <MechanicHome setActiveTab={setActiveTab} isApproved={isApproved} />;
      case "map":
        return <div className="p-4 font-michroma-sans text-center text-2xl text-muted-foreground ">Map Component (Only Available while on service request)</div>
      case "settings":
        return <SettingsPage />
      case "profile":
        return <MechanicProfileView />
      case "history":
        return <MechanicHistory />
      default:
        return (
          <MechanicHome setActiveTab={setActiveTab} isApproved={isApproved} />
        );
    }
  }

  return (
    <div className="w-full">
      {renderContent()}
    
      <BottomNavigation 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
        showMap={false}
      />

    </div>
  )
}
