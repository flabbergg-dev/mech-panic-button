"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { PushNotificationButton } from "../PushNotificationButton"
import { UserAvatar } from "../user-avatar"



export const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  // on router change close the mobile menu
  const pathname = usePathname()

  useEffect(() => {
    setIsOpen(false)
  }, [pathname])

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 1)
      setIsOpen(false)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [pathname])



  return (
    <>
    <header>

    <nav
      className={`${pathname.includes("dashboard") ? "sticky" : "fixed"}
       
        w-full top-0 z-50 transition-all duration-300 ${isScrolled || isOpen ? "bg-background/80 backdrop-blur-md shadow-sm " : "bg-transparent "} $`}
    >
      <div
        className={` mx-auto px-4 sm:px-6 lg:px-8 ${pathname.includes("dashboard") ? "bg-background/90" : ""}`}
      >
        <div className="flex justify-between items-center h-16 space-x-1">
          {/* Logo Section */}
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-text font-michroma-sans">
              Mech-Panic Button
            </span>
          </Link>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-4">
              <PushNotificationButton className="hover:bg-transparent p-2 rounded-md transition-colors duration-200" />   
              <UserAvatar />         
            </div>
          </div>
        </div>
      </div>


    </nav>
    </header>
    </>
  )
}
