"use client"

import { useEffect, useState } from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "./button"

export function ModeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark")
  }

  return (
    <Button
      variant={"ghost"}
      onClick={toggleTheme}
      className={` relative w-16 h-8 rounded-full p-1 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50
        ${theme === "dark" ? "bg-background" : "bg-secondary"}
      `}
      aria-label="Toggle color scheme"
    >
      <div
        className={`absolute top-1 left-1 w-6 h-6 rounded-full bg-white shadow-md transform transition-transform duration-300 ease-in-out flex items-center justify-center ${
          theme === "dark" ? "translate-x-8" : ""
        }`}
      >
        {theme === "dark" ? (
          <Moon className="h-5 w-5 m-0.5 text-background " />
        ) : (
          <Sun className="h-5 w-5 m-0.5 text-secondary " />
        )}
      </div>
    </Button>
  )
}
