"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
// import { useAuth } from "@clerk/nextjs"

import { AnimatePresence, motion } from "framer-motion"
import Logo from "../icons/logo"
import { NavLinks } from "./navlinks"
import { Button } from "../ui/button"
import { ThemeSwitcher } from "../theme-switcher"
import { MenuIcon } from "../icons/menu-icon"

// import { getUserAction } from "app/actions/userActions"

// import { SignOutButton } from "../Buttons/SignOutButton"


export const Navbar = () => {
  // const { userId } = useAuth()
  const userId = null
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
    <nav
      className={`${pathname.includes("dashboard") ? "sticky" : "fixed"}
       
        w-full top-0 z-50 transition-all duration-300 ${isScrolled || isOpen ? "bg-background/80 backdrop-blur-md shadow-sm " : "bg-transparent "} $`}
    >
      <div
        className={` mx-auto px-4 sm:px-6 lg:px-8 ${pathname.includes("dashboard") ? "bg-background/90" : ""}`}
      >
        <div className="flex justify-between items-center h-16 ">
          {/* Logo Section */}
          <Link href="/" className="flex items-center space-x-2">
            <Logo />
            <span className="text-text font-semibold text-xl font-michroma-sans">
              Mech-Panic Button
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            <NavLinks
              textStyles="text-sm font-medium text-text hover:text-text  transition-colors duration-200"
              userId={userId}
            />
            <div className="flex items-center space-x-4">
              {!userId ? (
                <Button variant="default" asChild>
                  <Link href="/sign-in">Sign In</Link>
                </Button>
              ) : (
                <>
                  <Button variant="outline" asChild>
                    <Link href={`/dashboard`}>Dashboard</Link>
                  </Button>
                  {/* <SignOutButton /> */}
                </>
              )}
              <ThemeSwitcher />
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              onClick={() => setIsOpen(!isOpen)}
              aria-label="Toggle menu"
              className="hover:bg-transparent p-2 rounded-md transition-colors duration-200"
            >
              <MenuIcon isOpen={isOpen} />
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "80dvh", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="md:hidden bg-background  fixed w-full overflow-hidden flex flex-col  items-start align-middle justify-between"
          >
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              <NavLinks
                textStyles={`block px-3 py-2 rounded-md text-foreground font-medium hover:text-text/80 hover:bg-background/90 transition-colors duration-200`}
                userId={userId}
              />
            </div>
            <div className="py-4 flex flex-row gap-2 mx-auto justify-center w-full">
              <div className="flex items-center px-2 space-x-4 min-w-full">
                {!userId ? (
                  <Button variant="default" asChild className="w-full">
                    <Link href="/sign-in">Sign In</Link>
                  </Button>
                ) : (
                  <div className="flex items-center space-x-4 w-full">
                    <Button asChild className="w-full flex-1 bg-blue-800">
                      <Link href={`/dashboard`}>Dashboard</Link>
                    </Button>
                    {/* <SignOutButton /> */}
                  </div>
                )}
                <>
                <ThemeSwitcher />
                </>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  )
}
