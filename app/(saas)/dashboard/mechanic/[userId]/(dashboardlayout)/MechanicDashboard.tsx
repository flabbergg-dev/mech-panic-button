"use client"

import { useUser } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

export default function MechanicDashboard() {
  const { user } = useUser()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthorized, setIsAuthorized] = useState(false)

  useEffect(() => {
    const checkRole = async () => {
      try {
        const response = await fetch("/api/user/role", {
          credentials: "include",
        })

        if (!response.ok) {
          throw new Error("Failed to fetch role")
        }

        const data = await response.json()
        
        // If no role, redirect to onboarding
        if (!data.role) {
          router.push("/onboarding")
          return
        }

        // If not a Mechanic, redirect to appropriate dashboard
        if (data.role !== "Mechanic") {
          router.push(`/dashboard/${data.role.toLowerCase()}/${user?.id}`)
          return
        }

        // Only set authorized if the role is Mechanic
        setIsAuthorized(true)
      } catch (error) {
        console.error("Error checking role:", error)
        router.push("/")
      } finally {
        setIsLoading(false)
      }
    }

    if (user) {
      checkRole()
    }
  }, [user, router])

  // Show loading state
  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  // Don't render anything if not authorized
  if (!isAuthorized) {
    return null
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Mechanic Dashboard</h1>
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Welcome, {user?.firstName}!</h2>
        <p className="text-gray-600">
          This is your mechanic dashboard. Here you can manage service requests and your availability.
        </p>
      </div>
    </div>
  )
}
