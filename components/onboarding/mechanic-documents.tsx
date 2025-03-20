"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useUser } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { onboardUserAction } from "@/app/actions/user/onboard-user.action"
import { X } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { uploadDocuments } from "@/app/actions/mechanic/upload-documents"

interface MechanicDocumentsProps {
  formData: {
    firstName: string;
    lastName: string;
    email: string;
    make: string;
    model: string;
    year: number;
    license: string;
  };
  stripeConnectId: string | null;
}

interface MechanicDocuments {
  driversLicenseId: string
  merchantDocumentUrl: string
}

export const MechanicDocuments = ({
  formData,
  stripeConnectId,
}: MechanicDocumentsProps) => {
  const router = useRouter();
  const { user } = useUser();
  const [isUploading, setIsUploading] = useState(false);
  const [driversLicense, setDriversLicense] = useState<File | null>(null);
  const [merchantDocument, setMerchantDocument] = useState<File | null>(null);
  const [hasDriversLicense, setHasDriversLicense] = useState(false);
  const [hasMerchantDocument, setHasMerchantDocument] = useState(false);
  const [onboarded, setOnboarded] = useState(false);
  const [country, setCountry] = useState<"Puerto Rico" | "United States">(
    "Puerto Rico"
  );
  const [driversLicenseUploadProgress, setDriversLicenseUploadProgress] = useState<number | null>(null);
  const [merchantDocumentUploadProgress, setMerchantDocumentUploadProgress] = useState<number | null>(null);

  const handleFileUpload = async (
    file: File | null,
    type: "driversLicense" | "merchantDocument"
  ) => {
    if (!file || !user) {
      toast.error("Please select a file to upload");
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast.error("File exceeds the 5MB size limit");
      return;
    }

    setIsUploading(true);

    try {
      if (stripeConnectId && !onboarded) {
        const onboardResult = await onboardUserAction({
          ...formData,
          role: "Mechanic" as const,
          stripeConnectId,
          country,
        });

        if (!onboardResult.success) {
          throw new Error(onboardResult.error);
        }
        setOnboarded(true);


      }

      const documentFormData = new FormData();
      documentFormData.append(type, file);
      documentFormData.append("userId", user.id);

      const onUploadProgress = (progressEvent: ProgressEvent) => {
        const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        if (type === "driversLicense") {
          setDriversLicenseUploadProgress(progress);
        } else {
          setMerchantDocumentUploadProgress(progress);
        }
      };

      const result = await uploadDocuments(user.id, file, null, onUploadProgress);

      if (!result.success) {
        throw new Error(result.error);
      }

      toast.success(`${type === "driversLicense" ? "Driver's License" : "Merchant Document"} uploaded successfully`);

      if (type === "driversLicense") {
        setHasDriversLicense(true);
      } else if (type === "merchantDocument") {
        setHasMerchantDocument(true);
      }

      // Navigate if both documents are uploaded and country is Puerto Rico
      if (country === "Puerto Rico" && stripeConnectId && hasDriversLicense && hasMerchantDocument) {
        router.push("/dashboard");
      } else if (country === "United States" && stripeConnectId && hasDriversLicense) {
        router.push("/dashboard");
      } else if (onboarded && hasDriversLicense && hasMerchantDocument && stripeConnectId) {
        window.location.reload();
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to upload document");
    } finally {
      setIsUploading(false);
      if (type === "driversLicense") {
        setDriversLicenseUploadProgress(null);
      } else {
        setMerchantDocumentUploadProgress(null);
      }
    }
  };

  const handleCloseClick = () => {
    window.location.reload();
  };

  return (
    <>
      <div className="space-y-4">
        <div>
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold flex-1">
              Required Documents
            </h2>
            <Button
              variant="ghost"
              className="absolute right-6 top-6 hover:bg-transparent"
              onClick={() => handleCloseClick()}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <p className="text-muted-foreground">
            Please upload your driver's license and merchant document to
            complete your registration
          </p>
        </div>
        <div className="space-y-6">
          <div>
            <Label htmlFor="country">Country</Label>
            <Select
              value={country}
              onValueChange={(value: "Puerto Rico" | "United States") =>
                setCountry(value)
              }
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
                const file = e.target.files?.[0];
                setDriversLicense(file || null);
                if (file) {
                  handleFileUpload(file, "driversLicense");
                }
              }}
              disabled={isUploading || hasDriversLicense}
              className="mt-2"
            />
            {hasDriversLicense && (
              <p className="text-sm text-green-600 mt-1">
                ✓ Driver's License uploaded
              </p>
            )}
            {driversLicenseUploadProgress !== null && (
              <div className="mt-2">
                <p>Upload Progress: {driversLicenseUploadProgress}%</p>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className="bg-blue-600 h-2.5 rounded-full"
                    style={{ width: `${driversLicenseUploadProgress}%` }}
                  />
                </div>
              </div>
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
                  const file = e.target.files?.[0];
                  setMerchantDocument(file || null);
                  if (file) {
                    handleFileUpload(file, "merchantDocument");
                  }
                }}
                disabled={isUploading || hasMerchantDocument}
                className="mt-2"
              />
              {hasMerchantDocument && (
                <p className="text-sm text-green-600 mt-1">
                  ✓ Merchant Document uploaded
                </p>
              )}
              {merchantDocumentUploadProgress !== null && (
                <div className="mt-2">
                  <p>Upload Progress: {merchantDocumentUploadProgress}%</p>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className="bg-blue-600 h-2.5 rounded-full"
                      style={{ width: `${merchantDocumentUploadProgress}%` }}
                    />
                  </div>
                </div>
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
    </>
  );
};
