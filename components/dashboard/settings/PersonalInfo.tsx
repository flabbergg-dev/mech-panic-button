"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useUser } from "@clerk/nextjs"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { UpdateUserDTO, updateUserSchema } from "@/lib/domain/dtos/user.dto"
import { updateUserProfileAction } from "@/app/actions/user/update-user-profile.action"
import { getUserProfileAction } from "@/app/actions/user/get-user-profile.action"
import { useToast } from "@/hooks/use-toast"
import { ProfileImageUpload } from "@/components/dashboard/settings/ProfileImageUpload"
import { prisma } from "@/lib/prisma"

export function PersonalInfoForm() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const { user, isLoaded: isUserLoaded } = useUser()
  const { toast } = useToast()
  const router = useRouter()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    watch,
  } = useForm<UpdateUserDTO>({
    resolver: zodResolver(updateUserSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phoneNumber: "",
      dob: "",
      currentLocation: null,
      serviceArea: null,
      documentsUrl: [],
    }
  })

  // Watch form values for debugging
  const formValues = watch();
  useEffect(() => {
    console.log("Current form values:", formValues);
  }, [formValues]);

  useEffect(() => {
    async function loadUserProfile() {
      if (!isUserLoaded) return;
      
      if (!user?.id) {
        console.log("No user ID available");
        setIsLoading(false);
        return;
      }

      try {
        console.log("Loading profile for Clerk user ID:", user.id);
        
        // First, try to get the user profile
        const result = await getUserProfileAction(user.id);
        console.log("Profile fetch result:", result);

        if (result.success && result.data) {
          console.log("Setting form data with:", result.data);
          reset({
            firstName: result.data.firstName || "",
            lastName: result.data.lastName || "",
            email: result.data.email || "",
            phoneNumber: result.data.phoneNumber || "",
            dob: result.data.dob || "",
            currentLocation: result.data.currentLocation || null,
            documentsUrl: result.data.documentsUrl || [],
          }, { keepDefaultValues: false });
          
          // Verify form values were set
          console.log("Form values after reset:", watch());
        } else {
          console.error("Failed to fetch profile:", result.error);
          toast({
            title: "Error",
            description: result.error || "Failed to load profile data",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Error in loadUserProfile:", error);
        toast({
          title: "Error",
          description: "Failed to load profile data",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    }

    loadUserProfile();
  }, [isUserLoaded, user?.id, reset, toast, watch]);

  const onSubmit = async (data: UpdateUserDTO) => {
    if (!user?.id) {
      console.error("No user ID available for submission");
      return;
    }

    try {
      setIsSubmitting(true);
      console.log("Form data being submitted:", data);
      
      const formData = {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phoneNumber: data.phoneNumber || "",
        dob: data.dob || "",
        currentLocation: data.currentLocation || null,
        serviceArea: data.serviceArea || null,
        documentsUrl: data.documentsUrl || [],
      };

      console.log("Processed form data:", formData);
      const result = await updateUserProfileAction(formData, false);
      console.log("Update result:", result);

      if (!result.success) {
        throw new Error(result.error);
      }

      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated.",
      });

      router.refresh();
    } catch (error) {
      console.error("Error in onSubmit:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isUserLoaded || isLoading) {
    return <div>Loading profile data...</div>;
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      <div className="space-y-8">
        <ProfileImageUpload 
          currentImage={user?.imageUrl} 
          userId={user?.id || ""}
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="firstName">First Name</Label>
            <Input
              id="firstName"
              {...register("firstName")}
            />
            {errors.firstName && (
              <p className="text-sm text-red-500">{errors.firstName.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="lastName">Last Name</Label>
            <Input
              id="lastName"
              {...register("lastName")}
            />
            {errors.lastName && (
              <p className="text-sm text-red-500">{errors.lastName.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              {...register("email")}
              type="email"
              readOnly
            />
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="phoneNumber">Phone Number</Label>
            <Input
              id="phoneNumber"
              {...register("phoneNumber")}
            />
            {errors.phoneNumber && (
              <p className="text-sm text-red-500">{errors.phoneNumber.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="dob">Date of Birth</Label>
            <Input 
              id="dob"
              {...register("dob")}
              type="date"
              max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]}
            />
            {errors.dob && (
              <p className="text-sm text-red-500">{errors.dob.message}</p>
            )}
          </div>
        </div>
      </div>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Updating..." : "Update Profile"}
      </Button>
    </form>
  );
}
