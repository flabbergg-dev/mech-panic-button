"use client"

import { useUser } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function OnboardingPage() {
  const { user, isLoaded } = useUser()
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    email: user?.primaryEmailAddress?.emailAddress || "",
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleRoleSelection = async (role: "Customer" | "Mechanic") => {
    if (!user || isSubmitting) return
    
    if (!formData.email || !formData.firstName || !formData.lastName) {
      alert("Please fill in all required fields")
      return
    }
    
    setIsSubmitting(true)
    try {
      const response = await fetch("/api/user/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          role,
          ...formData
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to create user")
      }

      // Wait a moment for the role to be properly set
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Redirect to the appropriate dashboard
      router.push(role === "Mechanic" ? `/dashboard/mechanic/${user.id}` : `/dashboard/customer/${user.id}`)
    } catch (error) {
      console.error("Error creating user:", error)
      alert("Failed to create user. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Welcome to Mech-Panic</h1>
          <p className="mt-2 text-gray-600">Please complete your profile</p>
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              required
            />
          </div>
          
          <div>
            <Label htmlFor="firstName">First Name</Label>
            <Input
              id="firstName"
              name="firstName"
              value={formData.firstName}
              onChange={handleInputChange}
              required
            />
          </div>
          
          <div>
            <Label htmlFor="lastName">Last Name</Label>
            <Input
              id="lastName"
              name="lastName"
              value={formData.lastName}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="space-y-4 pt-4">
            <h2 className="text-xl font-semibold text-center">I am a...</h2>
            <div className="grid grid-cols-2 gap-4">
              <Button
                onClick={() => handleRoleSelection("Customer")}
                disabled={isSubmitting}
                className="w-full"
              >
                Customer
              </Button>
              <Button
                onClick={() => handleRoleSelection("Mechanic")}
                disabled={isSubmitting}
                className="w-full"
              >
                Mechanic
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
