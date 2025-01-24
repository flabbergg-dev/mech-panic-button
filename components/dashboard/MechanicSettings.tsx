"use client"

import { useState } from "react"
import {
  User,
  Briefcase,
  Bell,
  Shield,
  CreditCard,
  Settings2,
  ChevronRight,
  Menu,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { PersonalInfoForm } from "./settings/PersonalInfo"
import { MechanicInfoForm } from "./settings/MechanicInfo"
import { usePathname } from "next/navigation"
import { Separator } from "../ui/separator"
import { ThemeSwitcher } from "../theme-switcher"
import { motion, AnimatePresence } from "framer-motion"
import { Badge } from "@/components/ui/badge"
import { PushNotificationButton } from "../PushNotificationButton"

const sections = [
  { 
    id: "personal", 
    icon: User, 
    label: "Personal Info",
    description: "Manage your personal information and profile",
    badge: "Active"
  },
  { 
    id: "professional", 
    icon: Briefcase, 
    label: "Professional Details",
    description: "Update your work experience and skills",
    badge: "Required"
  },
  { 
    id: "notifications", 
    icon: Bell, 
    label: "Notifications",
    description: "Configure how you receive updates",
    badge: "3 New"
  },
  { 
    id: "security", 
    icon: Shield, 
    label: "Security",
    description: "Manage your account security settings" 
  },
  { 
    id: "billing", 
    icon: CreditCard, 
    label: "Billing",
    description: "Review your subscription and payments",
    badge: "Pro"
  },
  { 
    id: "preferences", 
    icon: Settings2, 
    label: "Preferences",
    description: "Customize your app experience" 
  },
]

const SettingsPage = () => {
  const [activeSection, setActiveSection] = useState("personal")
  const path = usePathname()
  const isMechanic = path.includes("mechanic")
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const renderSection = () => {
    switch (activeSection) {
      case "personal":
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            <div className="flex flex-col space-y-1.5">
              <h2 className="text-2xl font-semibold tracking-tight">Personal Information</h2>
              <p className="text-sm text-muted-foreground">
                Update your personal details and how others see you on the platform
              </p>
            </div>
            <PersonalInfoForm />
            {isMechanic && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <Separator className="my-8" />
                <div className="flex flex-col space-y-1.5 mb-6">
                  <h2 className="text-2xl font-semibold tracking-tight">Mechanic Profile</h2>
                  <p className="text-sm text-muted-foreground">
                    Showcase your expertise and services to potential customers
                  </p>
                </div>
                <MechanicInfoForm />
              </motion.div>
            )}
          </motion.div>
        )
      default:
        return (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center h-[60vh] space-y-4"
          >
            <div className="relative w-24 h-24">
              <motion.div
                className="absolute inset-0 bg-primary/10 rounded-full"
                animate={{
                  scale: [1, 1.2, 1],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
              <Settings2 className="w-24 h-24 text-primary/40" />
            </div>
            <p className="text-xl font-medium">Coming Soon</p>
            <p className="text-sm text-muted-foreground text-center max-w-md">
              We're working hard to bring you this feature. Stay tuned for updates!
            </p>
          </motion.div>
        )
    }
  }

  const SidebarContent = () => (
    <div className="space-y-1.5 py-4 ">
      {sections.map((section) => {
        const Icon = section.icon
        const isActive = activeSection === section.id
        return (
          <Button
            key={section.id}
            variant={isActive ? "secondary" : "ghost"}
            className={cn(
              "w-full justify-start text-left h-auto py-3 px-4 hover:bg-muted/50",
              isActive && "bg-secondary"
            )}
            onClick={() => {
              setActiveSection(section.id)
              setIsMenuOpen(false)
            }}
          >
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center space-x-3">
                <div className={cn(
                  "p-2 rounded-md",
                  isActive ? "bg-primary/10" : "bg-muted"
                )}>
                  <Icon className={cn(
                    "h-5 w-5",
                    isActive && "text-primary"
                  )} />
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center space-x-2">
                    <p className="font-medium">{section.label}</p>
                    {section.badge && (
                      <Badge variant={isActive ? "secondary" : "outline"} className="ml-2">
                        {section.badge}
                      </Badge>
                    )}
                  </div>
                  <p
                    className="text-sm text-muted-foreground hidden md:block max-w-[200px] text-wrap"
                  >
                    {section.description}
                  </p>
                </div>
              </div>
              <ChevronRight className={cn(
                "h-4 w-4 text-muted-foreground transition-transform",
                isActive && "transform rotate-90"
              )} />
            </div>
          </Button>
        )
      })}
    </div>
  )

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background pb-12">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="md:hidden shrink-0">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[300px] p-0">
                <SheetHeader className="px-6 py-4 border-b">
                  <SheetTitle>Settings</SheetTitle>
                </SheetHeader>
                <div className="px-2 overflow-y-auto">
                  <SidebarContent />
                </div>
              </SheetContent>
            </Sheet>
            <div>
              <h1 className="text-2xl font-bold">
                {sections.find(s => s.id === activeSection)?.label}
              </h1>
              <p className="text-sm text-muted-foreground hidden sm:block ">
                {sections.find(s => s.id === activeSection)?.description}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
          <PushNotificationButton className="shadow-none" />

            <ThemeSwitcher />
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:space-x-8">
          <div className="hidden md:block w-[300px] shrink-0">
            <div className="sticky top-6 pt-4">
              <SidebarContent />
            </div>
          </div>
          
          <main className="flex-1 md:pt-4">
            <AnimatePresence mode="wait">
              {renderSection()}
            </AnimatePresence>
          </main>
        </div>
      </div>
    </div>
  )
}

export default SettingsPage
