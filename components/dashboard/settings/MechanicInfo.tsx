"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useUser } from "@clerk/nextjs"
import { zodResolver } from "@hookform/resolvers/zod"
import { Check } from "lucide-react"
import { Controller, useForm } from "react-hook-form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { UpdateMechanicDTO, updateMechanicProfileSchema } from "@/lib/domain/dtos/user.dto"
import { updateUserProfileAction } from "@/app/actions/update-user-profile.action"
import { useToast } from "@/hooks/use-toast"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"

const SERVICES_OFFERED = [
  "Oil Change",
  "Brake Service",
  "Engine Repair",
  "Transmission",
  "Electrical Systems",
  "AC Service",
  "Tire Service",
  "Diagnostics",
  "Body Work",
  "General Maintenance"
]

export function MechanicInfoForm() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { user } = useUser()
  const { toast } = useToast()
  const router = useRouter()

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<UpdateMechanicDTO>({
    resolver: zodResolver(updateMechanicProfileSchema),
    defaultValues: {
      bio: "",
      servicesOffered: [],
      availabilityStatus: false,
    },
  })

  const onSubmit = async (data: UpdateMechanicDTO) => {
    try {
      setIsSubmitting(true)
      const result = await updateUserProfileAction(data, true)

      if (!result.success) {
        throw new Error(result.error)
      }

      toast({
        title: "Profile Updated",
        description: "Your mechanic profile has been successfully updated.",
      })

      router.refresh()
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update profile",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="bio">Professional Bio</Label>
          <Textarea 
            {...register("bio")} 
            placeholder="Tell us about your experience and expertise..."
          />
          {errors.bio && (
            <p className="text-sm text-red-500">{errors.bio.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="servicesOffered">Services Offered</Label>
          <Controller
            name="servicesOffered"
            control={control}
            render={({ field }) => (
              <Select
                value={field.value?.join(",")}
                onValueChange={(value) => field.onChange(value.split(","))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select services you offer" />
                </SelectTrigger>
                <SelectContent>
                  {SERVICES_OFFERED.map((service) => (
                    <SelectItem key={service} value={service}>
                      {service}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.servicesOffered && (
            <p className="text-sm text-red-500">{errors.servicesOffered.message}</p>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <Controller
            name="availabilityStatus"
            control={control}
            render={({ field }) => (
              <Switch
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            )}
          />
          <Label htmlFor="availabilityStatus">Available for Service</Label>
          {errors.availabilityStatus && (
            <p className="text-sm text-red-500">{errors.availabilityStatus.message}</p>
          )}
        </div>

        <div>
          <Label>Documents</Label>
          <div className="space-y-2">
            <div>
              <Label htmlFor="bannerImage">Banner Image</Label>
              <Input
                type="file"
                accept="image/*"
                {...register("bannerImage")}
              />
            </div>
            <div>
              <Label htmlFor="driversLicenseId">Driver's License</Label>
              <Input
                type="file"
                accept="image/*,.pdf"
                {...register("driversLicenseId")}
              />
            </div>
            <div>
              <Label htmlFor="merchantDocumentUrl">Merchant Document</Label>
              <Input
                type="file"
                accept=".pdf"
                {...register("merchantDocumentUrl")}
              />
            </div>
          </div>
        </div>
      </div>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? (
          "Updating..."
        ) : (
          <>
            <Check className="mr-2 h-4 w-4" /> Save Mechanic Profile
          </>
        )}
      </Button>
    </form>
  )
}
