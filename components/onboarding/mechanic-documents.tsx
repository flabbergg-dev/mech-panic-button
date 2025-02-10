"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useUser } from "@clerk/nextjs"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { onboardUserAction } from "@/app/actions/user/onboard-user.action"
import { updateMechanicDocumentsAction } from "@/app/actions/mechanic/update-mechanic-documents.action"
import { HalfSheet } from "../ui/HalfSheet"
import { X } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { StripeOnboarding } from "../StripeOnboarding/StripeOnboarding"
interface MechanicDocumentsProps {
  formData: {
    firstName: string
    lastName: string
    email: string
   
  }
}

interface MechanicDocuments {
  driversLicenseId: string
  merchantDocumentUrl: string
}

export const MechanicDocuments = ({ formData }: MechanicDocumentsProps) => {
  const router = useRouter()
  const { user } = useUser()
  const { toast } = useToast()
  const [isUploading, setIsUploading] = useState(false)
  const [driversLicense, setDriversLicense] = useState<File | null>(null)
  const [merchantDocument, setMerchantDocument] = useState<File | null>(null)
  const [hasDriversLicense, setHasDriversLicense] = useState(false)
  const [hasMerchantDocument, setHasMerchantDocument] = useState(false)
  const [country, setCountry] = useState<"Puerto Rico" | "United States">("Puerto Rico")

  const handleFileUpload = async (file: File | null, type: 'driversLicense' | 'merchantDocument') => {
    if (!file || !user) {
      toast({
        title: "Error",
        description: "Please select a file to upload",
        variant: "destructive",
      })
      return
    }

    setIsUploading(true)

    try {
      // Only onboard if this is the first document being uploaded
      if (!hasDriversLicense && !hasMerchantDocument) {
        const onboardResult = await onboardUserAction({
          ...formData,
          role: "Mechanic" as const,
        })

        if (!onboardResult.success) {
          throw new Error(onboardResult.error)
        }
      }

      const documentFormData = new FormData()
      if (type === 'driversLicense') {
        documentFormData.append("driversLicense", file)
      } else {
        documentFormData.append("merchantDocument", file)
      }
      documentFormData.append("userId", user.id)

      const uploadResponse = await fetch("/api/upload/mechanic-documents", {
        method: "POST",
        body: documentFormData,
      })

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json()
        throw new Error(errorData.error || "Failed to upload document")
      }

      const result = await uploadResponse.json()
      
      if (result.driversLicenseId) {
        setHasDriversLicense(true)
      }
      if (result.merchantDocumentUrl) {
        setHasMerchantDocument(true)
      }

      toast({
        title: "Success",
        description: `${type === 'driversLicense' ? "Driver's License" : "Merchant Document"} uploaded successfully`,
      })

      // Only redirect if both documents are uploaded
      if (result.hasAllDocuments) {
        router.push("/dashboard")
      } else if (hasDriversLicense && country === "United States") {
        router.push("/dashboard")
      } else {
        router.refresh()
      }
    } catch (error) {
      console.error("Error:", error)
      toast({
        title: "Error",
        description: "Failed to upload document",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleCloseClick = () => {
    window.location.reload()
  }

  return (
    <HalfSheet className="bg-background border-t rounded-t-xl p-6">
      <div className="space-y-4">
        <div>
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold flex-1">Required Documents</h2>
            <Button variant="ghost" className="absolute right-6 top-6 hover:bg-transparent" onClick={() => handleCloseClick()}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <p className="text-muted-foreground">
            Please upload your driver's license and merchant document to complete your registration
          </p>
        </div>
        <div className="space-y-6">
          <div>
            <Label htmlFor="country">Country</Label>
            <Select
              value={country}
              onValueChange={(value: "Puerto Rico" | "United States") => setCountry(value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select your country" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Puerto Rico">Puerto Rico</SelectItem>
                <SelectItem value="United States">United States</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="driversLicense">Driver's License</Label>
            <input
              id="driversLicense"
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => {
                const file = e.target.files?.[0]
                setDriversLicense(file || null)
                if (file) {
                  handleFileUpload(file, 'driversLicense')
                }
              }}
              disabled={isUploading || hasDriversLicense}
              className="mt-2"
            />
            {hasDriversLicense && (
              <p className="text-sm text-green-600 mt-1">✓ Driver's License uploaded</p>
            )}
          </div>

          {country === "Puerto Rico" && (
            <div>
              <Label htmlFor="merchantDocument">Merchant Document</Label>
              <input
                id="merchantDocument"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  setMerchantDocument(file || null)
                  if (file) {
                    handleFileUpload(file, 'merchantDocument')
                  }
                }}
                disabled={isUploading || hasMerchantDocument}
                className="mt-2"
              />
              {hasMerchantDocument && (
                <p className="text-sm text-green-600 mt-1">✓ Merchant Document uploaded</p>
              )}
            </div>
          )}
        </div>

        {(!hasDriversLicense || !hasMerchantDocument) && (
          <p className="text-sm text-amber-600">
            Please upload required documents to continue to your dashboard
          </p>
        )}
      </div>
      <StripeOnboarding />
    </HalfSheet>
  )
}
