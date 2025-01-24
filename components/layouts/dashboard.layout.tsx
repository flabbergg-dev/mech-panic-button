import { ReactNode } from "react"
import { BottomNavigation } from "../navigation/bottom.navigation"
import { PushNotificationButton } from "../PushNotificationButton"

interface DashboardLayoutProps {
  children: ReactNode
}

export const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  return (
    <div className="min-h-screen bg-background p-4 ">
      <div className="max-w-md md:max-w-7xl mx-auto space-y-4">{children}</div>
    </div>
  )
}
