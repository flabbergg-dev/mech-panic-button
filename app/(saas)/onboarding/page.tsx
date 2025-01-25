"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useUser } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { onboardUserAction } from "@/app/actions/user/onboard-user.action"
import { checkUserRoleAction } from "@/app/actions/user/check-user-role.action"
import { MechanicDocuments } from "@/components/onboarding/mechanic-documents"
import { useToast } from "@/hooks/use-toast"

export default function OnboardingPage() {
  const { user } = useUser()
  const router = useRouter()
  const { toast } = useToast()
  const [selectedRole, setSelectedRole] = useState<"Customer" | "Mechanic" | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
  })
  
  // verify if the user is already a customer or mechanic
  useEffect(() => {
    const checkRole = async () => {
      const role = await checkUserRoleAction()
      if (role) {
        router.push('/dashboard')
      }
    }
    
    if (user) {
      checkRole()
    }
  }, [user, router])

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.emailAddresses[0]?.emailAddress || "",
      })
    }
  }, [user])

  const handleRoleSelection = async (role: "Customer" | "Mechanic") => {
    if (isSubmitting) return

    // Check if formData is fully populated
    if (!formData.firstName || !formData.lastName || !formData.email) {
      toast({
        title: "Error",
        description: "Please fill in all fields before submitting.",
        className: "bg-red-500 text-white",
      })
      return
    }

    console.log("Submitting form with data:", formData);

    try {
      setIsSubmitting(true)
      setSelectedRole(role)

      if (role === "Customer") {
        const result = await onboardUserAction({
          ...formData,
          role,
        })

        if (result.redirect) {
          router.push(result.redirect)
          return
        }

        if (!result.success) {
          throw new Error(result.error)
        }

        router.push("/dashboard")
      }
      // For mechanics, just show the document upload form
      // User will be created when documents are submitted
    } catch (error) {
      console.error("Error onboarding user:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create user",
        variant: "destructive",
      })
      setSelectedRole(null)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  // If mechanic role is selected, show document upload form
  if (selectedRole === "Mechanic") {
    return <MechanicDocuments formData={formData} />
  }

  return (
    <div className="container max-w-2xl mx-auto py-8">
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Complete Your Profile</h1>
          <p className="text-muted-foreground">
            Please provide your information to get started
          </p>
        </div>

        <div className="space-y-4">
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

          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              readOnly
            />
          </div>

          <div>
            <Label>I am a...</Label>
            <RadioGroup
              defaultValue={selectedRole || undefined}
              onValueChange={(value) => handleRoleSelection(value as "Customer" | "Mechanic")}
              className="grid grid-cols-2 gap-4 mt-2"
              disabled={isSubmitting}
            >
              <div>
                <RadioGroupItem
                  value="Customer"
                  id="customer"
                  className="peer sr-only"
                />
                <Label
                  htmlFor="customer"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-transparent p-4  hover:bg-primary hover:text-primary-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                >
                  <span>Customer</span>
                </Label>
              </div>

              <div>
                <RadioGroupItem
                  value="Mechanic"
                  id="mechanic"
                  className="peer sr-only"
                />
                <Label
                  htmlFor="mechanic"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-transparent p-4 hover:bg-primary hover:text-primary-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                >
                  <span>Mechanic</span>
                </Label>
              </div>
            </RadioGroup>
          </div>
        </div>
      </div>
    </div>
  )
}
