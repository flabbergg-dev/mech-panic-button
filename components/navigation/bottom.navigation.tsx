"use client"

import {
  HistoryIcon,
  HomeIcon,
  PinIcon,
  SettingsIcon,
  UserIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { usePathname } from 'next/navigation'

interface BottomNavigationProps {
  activeTab: string
  onTabChange: (tab: string) => void
  userRole?: string
}

export const BottomNavigation = ({
  activeTab,
  onTabChange,
  userRole = "Mechanic"
}: BottomNavigationProps) => {
  const pathname = usePathname()
  console.log(pathname)
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 max-w-md mx-auto rounded-t-3xl">
      <div className="flex justify-around items-center h-16 max-w-md mx-auto px-4">
        <NavItem
          id="home"
          pathname={pathname}
          icon={<HomeIcon />}
          isActive={activeTab === "home"}
          onClick={() => onTabChange("home")}
        />

        {userRole === "Customer" && (
          <NavItem
            id="map"
            pathname={pathname}
            icon={<PinIcon />}
            isActive={activeTab === "map"}
            onClick={() => onTabChange("map")}
          />
        )}
        <NavItem
          id="history"
          pathname={pathname}
          icon={<HistoryIcon />}
          isActive={activeTab === "history"}
          onClick={() => onTabChange("history")}
        />
        <NavItem
          id="profile"
          pathname={pathname}
          icon={<UserIcon />}
          isActive={activeTab === "profile"}
          onClick={() => onTabChange("profile")}
        />
        <NavItem
          id="settings"
          pathname={pathname}
          icon={<SettingsIcon />}
          isActive={activeTab === "settings"}
          onClick={() => onTabChange("settings")}
        />
      </div>
    </nav>
  )
}

interface NavItemProps {
  id: string
  pathname: string
  icon: React.ReactNode
  isActive: boolean
  onClick: () => void
}

const NavItem = ({ id, pathname, icon, isActive, onClick }: NavItemProps) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center justify-center w-12 h-12 rounded-full",
        isActive ? "text-red-600" : "text-gray-500"
      )}
    >
      {icon}
    </button>
  )
}
