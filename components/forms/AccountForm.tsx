"use client"

import React, { useState } from "react"
import { ModeToggle } from "@/components/ui/ModeToggle"
import {
  Briefcase,
  ChevronDown,
  ChevronUp,
  Clock,
  CreditCard,
  Lock,
  ShieldEllipsis,
  User,
} from "lucide-react"
import { useSwipeable } from "react-swipeable"
import { Tooltip } from "react-tooltip"

import { PersonalInfoForm } from "./PersonalInfoForm"

const SettingsPage = () => {
  const [activeSection, setActiveSection] = useState("personal")
  const [collapsedSections, setCollapsedSections] = useState<string[]>([])

  const sections = [
    { id: "personal", icon: User, label: "Personal Info" },
    { id: "professional", icon: Briefcase, label: "Professional Details" },
    { id: "account", icon: Lock, label: "Account Settings" },
    { id: "availability", icon: Clock, label: "Availability" },
    { id: "payment", icon: CreditCard, label: "Payment Information" },
    { id: "privacy", icon: ShieldEllipsis, label: "Privacy Settings" },
  ]

  const toggleSection = (sectionId: string) => {
    setCollapsedSections((prev) =>
      prev.includes(sectionId)
        ? prev.filter((id) => id !== sectionId)
        : [...prev, sectionId]
    )
  }

  const handlers = useSwipeable({
    onSwipedLeft: () => {
      const currentIndex = sections.findIndex((s) => s.id === activeSection)
      const nextSection = sections[currentIndex + 1]
      if (currentIndex < sections.length - 1 && nextSection) {
        if (nextSection) {
          const activeElement = document.activeElement as HTMLElement
          activeElement?.blur?.()
        }
        setActiveSection(nextSection.id)
      }
    },
    onSwipedRight: () => {
      const currentIndex = sections.findIndex((s) => s.id === activeSection)
      const prevSection = sections[currentIndex - 1]
      if (currentIndex > 0 && prevSection) {
        if (prevSection) {
          const activeElement = document.activeElement as HTMLElement
          activeElement?.blur?.()
        }
        setActiveSection(prevSection.id)
      }
    },
    preventScrollOnSwipe: true,
    trackMouse: true,
  })

  const renderSection = () => {
    switch (activeSection) {
      case "personal":
        return (
          <>
            <PersonalInfoForm />
          </>
        )
      // Add cases for other sections here

      default:
        return null
    }
  }

  return (
    <div
      {...handlers}
      className="container mx-auto p-4 md:p-6 max-h-screen overflow-y-auto h-dvh "
    >
      <div className="flex flex-row justify-between items-center mb-6">
        <h1 className={`text-2xl md:text-3xl font-bold }`}>Settings</h1>
        <ModeToggle />
      </div>

      <div className="flex flex-col md:flex-row">
        <nav className="mb-6 md:mb-0 md:w-1/4 md:pr-4">
          <ul className="flex md:flex-col  md:space-x-0 overflow-x-auto md:overflow-x-visible whitespace-nowrap">
            {sections.map(({ id, icon: Icon, label }) => (
              <li key={id}>
                <button
                  data-id={id}
                  onClick={() => setActiveSection(id)}
                  className={`flex items-center p-4 rounded w-full ${
                    activeSection === id
                      ? "bg-primary text-primary-foreground"
                      : "md:hover:bg-primary/40"
                  }`}
                  data-tooltip-id={`tooltip-${id}`}
                  data-tooltip-content={label}
                >
                  <Icon
                    className={`${activeSection === id ? "mx-2" : ""} w-6 h-6`}
                  />
                  <span className="hidden md:inline ml-2">{label}</span>
                </button>{" "}
                <Tooltip id={`tooltip-${id}`} place="right" delayShow={500} />{" "}
              </li>
            ))}
          </ul>
        </nav>

        <main className="md:w-3/4 pb-6">
          {sections.map(({ id, label }) => (
            <div
              key={id}
              className={`mb-6 ${activeSection !== id ? "hidden " : ""}`}
            >
              <button
                onClick={() => toggleSection(id)}
                className={
                  "md:hidden flex items-center justify-between w-full p-4 bg-gray-100 rounded-t text-lg font-semibold text-gray-700"
                }
              >
                {label}
                {collapsedSections.includes(id) ? (
                  <ChevronDown />
                ) : (
                  <ChevronUp />
                )}
              </button>
              {!collapsedSections.includes(id) && (
                <div className="p-4 border-x border-b rounded-b md:border-none">
                  {renderSection()}
                </div>
              )}
            </div>
          ))}
        </main>
      </div>
    </div>
  )
}

export default SettingsPage
