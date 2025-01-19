"use client"

import { useAuth } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Button } from "@/components/ui/button"

export default function OnboardingPage() {
  const { userId } = useAuth()
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleRoleSelection = async (role: "Customer" | "Mechanic") => {
    if (!userId || isSubmitting) return
    
    setIsSubmitting(true)
    try {
      const response = await fetch("/api/user/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          role,
          userId,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to create user")
      }

      // Redirect based on role
      router.push(role === "Mechanic" ? `/dashboard/mechanic/${userId}` : `/dashboard/customer/${userId}`)
    } catch (error) {
      console.error("Error creating user:", error)
      alert("Something went wrong. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-red-100 via-slate-300 to-slate-500">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <h1 className="text-2xl font-bold text-center mb-6">Welcome to Mech Panic!</h1>
        <p className="text-gray-600 text-center mb-8">Please select your role to continue</p>
        
        <div className="space-y-4">
          <Button
            onClick={() => handleRoleSelection("Customer")}
            disabled={isSubmitting}
            className="w-full py-3"
          >
            I need a mechanic
          </Button>
          
          <Button
            onClick={() => handleRoleSelection("Mechanic")}
            disabled={isSubmitting}
            variant="outline"
            className="w-full py-3"
          >
            I am a mechanic
          </Button>
        </div>
      </div>
    </div>
  )
}
