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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { MechanicOnboarding } from "@/components/onboarding/mechanic-onboarding"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Loader2 } from "lucide-react"

// TODO: 
// - Add param on page  to  catch the redirect of stripe
// - Add stripe onboarding

export default function OnboardingPage() {
  const { user } = useUser()
  const router = useRouter()
  const [selectedRole, setSelectedRole] = useState<"Customer" | "Mechanic" | null>(null)
  const [pendingRole, setPendingRole] = useState<"Customer" | "Mechanic" | null>(null)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    country: "Other",
    make: "",
    model: "",
    year: 1886,
    license: "",
  });
  const [currentStep, setCurrentStep] = useState<
    "StripeAccountSetup" | "documents"
  >("StripeAccountSetup");
  const [stripeConnectId, setStripeConnectId] = useState<string | null>(null);

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
        country: "Other",
        make: "",
        model: "",
        year: 1886,
        license: "",
      });
    }
  }, [user])

  const handleRoleSelection = (role: "Customer" | "Mechanic") => {
    setPendingRole(role)
    setShowConfirmDialog(true)
  }

  const confirmRoleSelection = () => {
    if (pendingRole) {
      setSelectedRole(pendingRole)
      setShowConfirmDialog(false)
    }
  }

  const cancelRoleSelection = () => {
    setPendingRole(null)
    setShowConfirmDialog(false)
  }

  const handleFormSubmission = async () => {
    if (isSubmitting) return

    // Check if formData is fully populated
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.make || !formData.model || !formData.year || !formData.license) {
       toast("Please fill in all fields before submitting.")
        return
    }

    setIsSubmitting(true)
    try {

      if (selectedRole === "Customer") {
        const result = await onboardUserAction({
          ...formData,
          year: Number.parseInt(formData.year.toString(), 10),
          role: selectedRole,
          country: "Other",
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
      toast(error instanceof Error ? error.message : "Failed to create user")
      setSelectedRole(null)
    } finally {
      setTimeout(() => {
        setIsSubmitting(false)
      }, 5000)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
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

          <p className="py-4 font-bold text-2xl">Car Details:</p>

          <div>
            <Label htmlFor="make">Car Make</Label>
            <Input
              id="make"
              name="make"
              placeholder="e.g. Toyota, Honda, etc."
              value={formData.make}
              onChange={handleInputChange}
              required
            />
          </div>

          <div>
            <Label htmlFor="model">Car Model</Label>
            <Input
              id="model"
              name="model"
              placeholder="e.g. Camry, Civic, etc."
              value={formData.model}
              onChange={handleInputChange}
              required
            />
          </div>

          <div>
            <Label htmlFor="year">Car Year</Label>
            <Input
              id="year"
              name="year"
              placeholder="e.g. 2015, 2020, etc."
              type="number"
              value={formData.year}
              onChange={handleInputChange}
              required
            />
          </div>

          <div>
            <Label htmlFor="license">Car License</Label>
            <Input
              id="license"
              name="license"
              placeholder="e.g. 123-ABC"
              value={formData.license}
              onChange={handleInputChange}
              required
            />
          </div>
{ !formData.firstName || !formData.lastName || !formData.email || !formData.make || !formData.model || !formData.year || !formData.license ? null :(<>
          <div>
            <Label>I am a...</Label>
            <RadioGroup
              value={selectedRole || undefined}
              onValueChange={(value) =>
                handleRoleSelection(value as "Customer" | "Mechanic")
              }
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
          <Button onClick={handleFormSubmission} disabled={isSubmitting || !selectedRole || !formData.firstName || !formData.lastName || !formData.email || !formData.make || !formData.model || !formData.year || !formData.license } className={cn("w-full", { "opacity-50 cursor-not-allowed": !selectedRole })}>{isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Submit"}</Button></>
          )}
          

          {selectedRole === "Mechanic" && (
            // If mechanic role is selected, show document upload form
            <MechanicOnboarding
              formData={formData}
              currentStep={currentStep}
              setCurrentStep={setCurrentStep}
              stripeConnectId={stripeConnectId}
              setStripeConnectId={setStripeConnectId}
            />
          )}
        </div>
      </div>
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Role Selection</DialogTitle>
            <DialogDescription>
              Are you sure you want to continue as a {pendingRole}? This choice
              will determine your experience on our platform.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex justify-between gap-2">
            <Button variant="outline" onClick={cancelRoleSelection}>
              Cancel
            </Button>
            <Button onClick={confirmRoleSelection}>Confirm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
