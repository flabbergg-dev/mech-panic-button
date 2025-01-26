"use client"

import { ReactNode, useState } from "react"
import { BottomNavigation } from "../navigation/bottom.navigation"
import { PushNotificationButton } from "../PushNotificationButton"
import { useUserRole } from "@/hooks/use-user-role"
interface DashboardLayoutProps {
  children: ReactNode
}

export const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const { userRole } = useUserRole()
  const [activeTab, setActiveTab] = useState("home")

  return (
    <div className="min-h-screen bg-background p-4 z-40">
      <div className="max-w-md md:max-w-7xl mx-auto space-y-4">{children}</div>
      <BottomNavigation
        activeTab={activeTab}
        onTabChange={setActiveTab}
        userRole={userRole ?? ''}
      />
    </div>
  )
}
