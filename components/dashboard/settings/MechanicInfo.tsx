import { getMechanicProfile } from "@/app/actions/mechanic/get-mechanic-profile.action";
import { updateMechanicAction } from "@/app/actions/mechanic/update-mechanic";
import { updateMechanicServices } from "@/app/actions/mechanic/update-mechanic-services";
import { uploadDocuments } from "@/app/actions/mechanic/upload-documents";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import useMechanicId from "@/hooks/useMechanicId";
import { updateMechanicProfileSchema } from "@/schemas/mechanics/mechanicProfileSchema";
import { useUser } from "@clerk/nextjs";
import { zodResolver } from "@hookform/resolvers/zod";
import { ServiceType } from "@prisma/client";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import ProgressBar from "@ramonak/react-progress-bar"

export function MechanicInfoForm() {
  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)  
  const [uploadProgress, setUploadProgress] = useState(0);
  const { user } = useUser()
  const { mechanicId, mechanicUserId } = useMechanicId()
  
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    setValue,
    watch,
  } = useForm<{
    bio: string;
    isAvailable: boolean;
    servicesOffered: ServiceType[];
    driversLicenseId: File | null;
    merchantDocumentUrl: File | null;
  }>({
    resolver: zodResolver(updateMechanicProfileSchema),
    defaultValues: {
      bio: "",
      isAvailable: false,
      servicesOffered: [] as ServiceType[],
      driversLicenseId: null,
      merchantDocumentUrl: null,
    },
  });
  
  useEffect(() => {
    async function loadMechanicProfile() {
      if (!user?.id) return
      
      try {
        setIsLoading(true)
        const profile = await getMechanicProfile()
        
        if (profile) {
          reset({
            bio: profile.bio || "",
            isAvailable: profile.isAvailable || false,
            servicesOffered: profile.servicesOffered,
            driversLicenseId: null,
            merchantDocumentUrl: null,
          })
        }
      } catch (error) {
        console.error("Error loading mechanic profile:", error)
        toast.error("Failed to load your profile information")
      } finally {
        setIsLoading(false)
      }
    }
    
    loadMechanicProfile()
  }, [user?.id, reset])

  const handleBioUpdate = async (bio: string) => {
    try {
      if (!mechanicId) return;
      
      const { success } = await updateMechanicAction({
        id: mechanicId,
        data: { bio }
      })
      
      if (!success) {
        throw new Error("Failed to update bio")
      }
      
      toast.success("Bio updated successfully")
    } catch (error) {
      console.error("Error updating bio:", error)
      toast.error("Failed to update bio")
    }
  }

  const handleAvailabilityToggle = async (isAvailable: boolean) => {
    try {
      if (!mechanicId) return;
      
      const { success } = await updateMechanicAction({
        id: mechanicId,
        data: { isAvailable }
      })
      
      if (!success) {
        throw new Error("Failed to update availability")
      }
      
      toast.success(`You are now ${isAvailable ? 'available' : 'unavailable'} for service requests`)
      setValue("isAvailable", isAvailable, { shouldValidate: true, shouldTouch: true })
    } catch (error) {
      console.error("Error updating availability:", error)
      toast.error("Failed to update availability status")
    }
  }

  const handleServiceToggle = async (service: ServiceType, isChecked: boolean) => {
    try {
      const currentServices = watch("servicesOffered") || []
      let updatedServices = [...currentServices]
      
      if (isChecked && !currentServices.includes(service)) {
        updatedServices.push(service)
      } else if (!isChecked && currentServices.includes(service)) {
        updatedServices = updatedServices.filter(s => s !== service)
      }
      
      setValue("servicesOffered", updatedServices)
      
      if (mechanicId) {
        const result = await updateMechanicServices({
          mechanicId,
          servicesOffered: updatedServices
        })
        
        if (result.success) {
          toast.success("Services updated successfully")
        } else {
          toast.error("Failed to update services")
        }
      }
    } catch (error) {
      console.error("Error updating services:", error)
      toast.error("Failed to update services")
    }
  }

  const handleDocumentUpload = async (type: 'driversLicense' | 'merchantDocument', file: File) => {
    if (!mechanicUserId) return;
    
    try {
      // Validate file size (5MB max)
      const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes
      if (file.size > MAX_FILE_SIZE) {
        toast.error("File size exceeds 5MB limit. Please upload a smaller file.");
        // Reset the file input
        setValue(type === 'driversLicense' ? 'driversLicenseId' : 'merchantDocumentUrl', null);
        return;
      }
      
      setIsUploading(true);
      setUploadProgress(0);
      
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 300);
      
      const result = await uploadDocuments(
        mechanicUserId, 
        type === 'driversLicense' ? file : null, 
        type === 'merchantDocument' ? file : null
      );
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      if (result.success) {
        toast.success(`${type === 'driversLicense' ? "Driver's License" : "Merchant Document"} uploaded successfully`);
      } else {
        toast.error(`Failed to upload ${type === 'driversLicense' ? "Driver's License" : "Merchant Document"}`);
      }
    } catch (error) {
      console.error(`Error uploading ${type}:`, error);
      toast.error(`Failed to upload ${type === 'driversLicense' ? "Driver's License" : "Merchant Document"}`);
      setUploadProgress(0);
      // Reset the file input on error
      setValue(type === 'driversLicense' ? 'driversLicenseId' : 'merchantDocumentUrl', null);
    } finally {
      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
      }, 1000);
    }
  };

  if (isLoading) {
    return <div>Loading mechanic information...</div>
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="space-y-4">
          {/* Bio Section */}
          <div className="space-y-2">
          <h3 className="text-lg font-medium pt-2">Bio</h3>
          <Textarea
              id="bio"
              placeholder="Tell clients about your experience and expertise"
              {...register("bio")}
            />
            {errors.bio && (
              <p className="text-sm text-red-500">{errors.bio.message?.toString()}</p>
            )}
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleBioUpdate(watch("bio"))}
            >
              Update Bio
            </Button>
          </div>

          {/* Availability Toggle */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="availability">Availability</Label>
              <p className="text-sm text-muted-foreground">
                Toggle your availability for new service requests
              </p>
            </div>
            <Switch
              id="availability"
              checked={watch("isAvailable")}
              onCheckedChange={handleAvailabilityToggle}
            />
          </div>

          {/* Services Offered */}
          <div className="space-y-3">
            <Label>Services Offered</Label>
            <div className="grid grid-cols-2 gap-2">
              {Object.values(ServiceType).map((service) => (
                <div key={service} className="flex items-center space-x-2">
                  <Checkbox
                    id={`service-${service}`}
                    checked={(watch("servicesOffered") || []).includes(service)}
                    onCheckedChange={(checked) => 
                      handleServiceToggle(service, checked as boolean)
                    }
                  />
                  <Label htmlFor={`service-${service}`} className="text-sm">
                    {service.replace(/_/g, ' ')}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Document Upload Section */}
          <div className="space-y-4 pt-4 border-t">
            <h3 className="text-lg font-medium">Documents</h3>
            
            {/* Driver's License Upload */}
            <div className="space-y-2">
              <Label htmlFor="driversLicense">Driver's License</Label>
              <p className="text-sm text-muted-foreground">
                Upload a copy of your driver's license (JPG, PNG, or PDF, max 5MB)
              </p>
              <Input
                id="driversLicense"
                type="file"
                accept="image/*,application/pdf"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setValue("driversLicenseId", file);
                    handleDocumentUpload('driversLicense', file);
                  }
                }}
                disabled={isUploading}
              />
              {isUploading && watch("driversLicenseId") && (
                <div className="mt-2">
                  <ProgressBar 
                    completed={uploadProgress} 
                    height="10px"
                    bgColor="#10b981"
                    baseBgColor="#e5e7eb"
                    labelColor="#ffffff"
                    labelSize="8px"
                  />
                </div>
              )}
              {errors.driversLicenseId && (
                <p className="text-sm text-red-500">{errors.driversLicenseId.message?.toString()}</p>
              )}
            </div>
            
            {/* Merchant Document Upload */}
            <div className="space-y-2">
              <Label htmlFor="merchantDocument">Merchant Document</Label>
              <p className="text-sm text-muted-foreground">
                Upload your merchant document (PDF only, max 5MB)
              </p>
              <Input
                id="merchantDocument"
                type="file"
                accept="application/pdf"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setValue("merchantDocumentUrl", file);
                    handleDocumentUpload('merchantDocument', file);
                  }
                }}
                disabled={isUploading}
              />
              {isUploading && watch("merchantDocumentUrl") && (
                <div className="mt-2">
                  <ProgressBar 
                    completed={uploadProgress} 
                    height="10px"
                    bgColor="#10b981"
                    baseBgColor="#e5e7eb"
                    labelColor="#ffffff"
                    labelSize="8px"
                  />
                </div>
              )}
              {errors.merchantDocumentUrl && (
                <p className="text-sm text-red-500">{errors.merchantDocumentUrl.message?.toString()}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
