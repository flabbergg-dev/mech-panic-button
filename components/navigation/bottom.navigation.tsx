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

interface BottomNavigationProps {
  activeTab: string
  onTabChange: (tab: string) => void
  userRole?: string
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
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 max-w-md mx-auto rounded-t-3xl z-50">
      <div className="flex justify-around items-center h-16 max-w-md mx-auto px-4">
        <NavItem
          id="home"
          icon={<HomeIcon className="h-6 w-6" />}
          isActive={activeTab === "home"}
          onClick={() => onTabChange("home")}
          disabled={disabledTabs.includes("home")}
        />

        {(userRole === "Customer" || showMap) && (
          <NavItem
            id="map"
            icon={<MapIcon className="h-6 w-6" />}
            isActive={activeTab === "map"}
            onClick={() => onTabChange("map")}
            disabled={disabledTabs.includes("map")}
          />
        )}

        {showRequests && (
          <NavItem
            id="requests"
            icon={<ClipboardListIcon className="h-6 w-6" />}
            isActive={activeTab === "requests"}
            onClick={() => onTabChange("requests")}
            disabled={disabledTabs.includes("requests")}
          />
        )}

        <NavItem
          id="history"
          icon={<HistoryIcon className="h-6 w-6" />}
          isActive={activeTab === "history"}
          onClick={() => onTabChange("history")}
          disabled={disabledTabs.includes("history")}
        />

        <NavItem
          id="settings"
          icon={<SettingsIcon className="h-6 w-6" />}
          isActive={activeTab === "settings"}
          onClick={() => onTabChange("settings")}
          disabled={disabledTabs.includes("settings")}
        />

        <NavItem
          id="profile"
          icon={<UserIcon className="h-6 w-6" />}
          isActive={activeTab === "profile"}
          onClick={() => onTabChange("profile")}
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
