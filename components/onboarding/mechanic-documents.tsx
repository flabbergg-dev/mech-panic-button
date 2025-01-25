"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useUser } from "@clerk/nextjs"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { onboardUserAction } from "@/app/actions/user/onboard-user.action"
import { updateMechanicDocumentsAction } from "@/app/actions/mechanic/update-mechanic-documents.action"

interface MechanicDocumentsProps {
  formData: {
    firstName: string
    lastName: string
    email: string
  }
}

export function MechanicDocuments({ formData }: MechanicDocumentsProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [driversLicense, setDriversLicense] = useState<File | null>(null)
  const [merchantDocument, setMerchantDocument] = useState<File | null>(null)
  const { user } = useUser()
  const { toast } = useToast()
  const router = useRouter()

  const handleFileChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    type: "driversLicense" | "merchantDocument"
  ) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "File size must be less than 5MB",
        variant: "destructive",
      })
      event.target.value = ""
      return
    }

    if (type === "driversLicense") {
      setDriversLicense(file)
    } else {
      setMerchantDocument(file)
    }
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!user?.id || !driversLicense || !merchantDocument) {
      toast({
        title: "Error",
        description: "Please upload both required documents",
        variant: "destructive",
      })
      return
    }

    try {
      setIsUploading(true)

      // First create the user as a mechanic
      const userData = await onboardUserAction({
        ...formData,
        role: "Mechanic",
      })

      if (!userData.success) {
        throw new Error(userData.error || "Failed to create user")
      }

      // Upload both documents
      const mechanicFormData = new FormData()
      mechanicFormData.append("driversLicense", driversLicense)
      mechanicFormData.append("merchantDocument", merchantDocument)
      mechanicFormData.append("userId", user.id)
      mechanicFormData.append("type", "document")

      const response = await fetch("/api/upload/mechanic-documents", {
        method: "POST",
        body: mechanicFormData,
      })

      if (!response.ok) {
        throw new Error("Failed to upload documents")
      }

      const data = await response.json()

      // Update mechanic profile with document URLs
      const result = await updateMechanicDocumentsAction(user.id, {
        driversLicenseId: data.driversLicenseUrl,
        merchantDocumentUrl: data.merchantDocumentUrl,
      })

      if (!result.success) {
        throw new Error(result.error)
      }

      toast({
        title: "Success",
        description: "Account created and documents uploaded successfully.",
      })

      // Redirect to dashboard
      router.push("/dashboard")
      router.refresh()
    } catch (error) {
      console.error("Error creating mechanic account:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create account",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Required Documents</CardTitle>
        <CardDescription>
          Please upload your driver&apos;s license and merchant document to complete your registration
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="driversLicense">Driver&apos;s License</Label>
              <input
                id="driversLicense"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => handleFileChange(e, "driversLicense")}
                disabled={isUploading}
                className="w-full"
                required
              />
              <p className="text-sm text-muted-foreground mt-1">
                Upload a clear photo or scan of your valid driver&apos;s license
              </p>
            </div>

            <div>
              <Label htmlFor="merchantDocument">Merchant Document</Label>
              <input
                id="merchantDocument"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => handleFileChange(e, "merchantDocument")}
                disabled={isUploading}
                className="w-full"
                required
              />
              <p className="text-sm text-muted-foreground mt-1">
                Upload your merchant certification or business registration document
              </p>
            </div>
          </div>

          <Button type="submit" disabled={isUploading || !driversLicense || !merchantDocument}>
            {isUploading ? "Creating Account..." : "Create Account & Upload Documents"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
