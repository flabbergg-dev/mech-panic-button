"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useUser } from "@clerk/nextjs"
import {
  HistoryIcon,
  HomeIcon,
  PinIcon,
  SettingsIcon,
  UserIcon,
} from "lucide-react"
import { MECHANIC_ROUTES } from "@/lib/routes/mechanic.routes"
import { cn } from "@/lib/utils"

type UserRole = "Mechanic" | "Customer"

export const BottomNavigation = () => {
  const { user } = useUser()
  const pathname = usePathname()
  const userRole : UserRole = pathname.includes("mechanic") ? "Mechanic" : "Customer" as UserRole
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
      <div className="flex justify-around items-center h-16 max-w-md mx-auto px-4">
        <NavItem href={MECHANIC_ROUTES.DASHBOARD} icon={<HomeIcon />} />

        {userRole === "Customer" && (
          <NavItem
            href={MECHANIC_ROUTES.MAP(user?.id || "")}
            icon={<PinIcon />}
          />
        )}
        <NavItem
          href={MECHANIC_ROUTES.SERVICE_HISTORY(user?.id || "")}
          icon={<HistoryIcon />}
        />
        <NavItem
          href={MECHANIC_ROUTES.PROFILE(user?.id || "")}
          icon={<UserIcon />}
        />
        <NavItem
          href={MECHANIC_ROUTES.SETTINGS(user?.id || "")}
          icon={<SettingsIcon />}
        />
      </div>
    </nav>
  )
}

interface NavItemProps {
  href: string
  icon: React.ReactNode
}

const NavItem = ({ href, icon }: NavItemProps) => {
  const isActive = usePathname() === href

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center justify-center w-12 h-12 rounded-full",
        isActive ? "text-red-600" : "text-gray-500"
      )}
    >
      {icon}
    </Link>
  )
}
