"use client"

import {
  HistoryIcon,
  HomeIcon,
  PinIcon,
  SettingsIcon,
  UserIcon,
  MapIcon,
  ClipboardListIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"

interface BottomNavigationProps {
  activeTab: string
  onTabChange: (tab: string) => void
  userRole?: "Customer" | "Mechanic"
  showMap?: boolean
  showRequests?: boolean
  disabledTabs?: string[]
}

export const BottomNavigation = ({
  activeTab,
  onTabChange,
  userRole = "Mechanic",
  showMap = true,
  showRequests = false,
  disabledTabs = [],
}: BottomNavigationProps) => {
  const router = useRouter()

  const handleTabChange = (tab: string) => {
    router.push(`?view=${tab}`)
    onTabChange(tab)
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 max-w-md mx-auto rounded-t-3xl z-40">
      <div className="flex justify-around items-center h-16 max-w-md mx-auto px-4">
        <NavItem
          id="home"
          icon={<HomeIcon className="h-6 w-6" />}
          isActive={activeTab === "home"}
          onClick={() => handleTabChange("home")}
          disabled={disabledTabs.includes("home")}
        />

        {(userRole === "Customer" || showMap) && (
          <NavItem
            id="map"
            icon={<MapIcon className="h-6 w-6" />}
            isActive={activeTab === "map"}
            onClick={() => handleTabChange("map")}
            disabled={disabledTabs.includes("map")}
          />
        )}

        {showRequests && (
          <NavItem
            id="requests"
            icon={<ClipboardListIcon className="h-6 w-6" />}
            isActive={activeTab === "requests"}
            onClick={() => handleTabChange("requests")}
            disabled={disabledTabs.includes("requests")}
          />
        )}

        <NavItem
          id="history"
          icon={<HistoryIcon className="h-6 w-6" />}
          isActive={activeTab === "history"}
          onClick={() => handleTabChange("history")}
          disabled={disabledTabs.includes("history")}
        />

        <NavItem
          id="settings"
          icon={<SettingsIcon className="h-6 w-6" />}
          isActive={activeTab === "settings"}
          onClick={() => handleTabChange("settings")}
          disabled={disabledTabs.includes("settings")}
        />

        <NavItem
          id="profile"
          icon={<UserIcon className="h-6 w-6" />}
          isActive={activeTab === "profile"}
          onClick={() => handleTabChange("profile")}
          disabled={disabledTabs.includes("profile")}
        />
      </div>
    </nav>
  )
}

interface NavItemProps {
  id: string
  icon: React.ReactNode
  isActive: boolean
  onClick: () => void
  disabled?: boolean
}

function NavItem({ id, icon, isActive, onClick, disabled }: NavItemProps) {
  return (
    <button
      className={cn(
        "flex flex-col items-center justify-center w-16 h-16 rounded-full transition-colors",
        isActive
          ? "text-primary"
          : disabled
          ? "text-gray-300 cursor-not-allowed"
          : "text-gray-500 hover:text-primary",
      )}
      onClick={onClick}
      disabled={disabled}
    >
      {icon}
    </button>
  )
}
