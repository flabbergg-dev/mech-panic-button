import { getUserProfileAction } from "@/app/actions/user/get-user-profile.action";
import { updateUserAction } from "@/app/actions/user/update-user";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { type UpdateUserProfile, updateUserSchema } from "@/schemas/users/userProfileSchema";
import { useUser } from "@clerk/nextjs";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { ProfileImageUpload } from "./ProfileImageUpload";

export function PersonalInfoForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { user, isLoaded: isUserLoaded } = useUser();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, dirtyFields },
    watch,
  } = useForm<UpdateUserProfile>({
    resolver: zodResolver(updateUserSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phoneNumber: "",
    }
  });

  const formValues = watch();

  useEffect(() => {
    async function loadUserProfile() {
      if (!isUserLoaded) return;
      
      if (!user?.id) {
        setIsLoading(false);
        return;
      }

      try {
        const result = await getUserProfileAction(user.id);

        if (result.success && result.data) {
          reset({
            firstName: result.data.firstName || "",
            lastName: result.data.lastName || "",
            email: result.data.email || "",
            phoneNumber: result.data.phoneNumber || "",
            documentsUrl: result.data.documentsUrl || [],
          }, { keepDefaultValues: false });
        } else {
          toast('Failed to load profile data');
        }
      } catch (error) {
        toast('Failed to load profile data');
      } finally {
        setIsLoading(false);
      }
    }

    loadUserProfile();
  }, [isUserLoaded, reset, user?.id]);

  const onSubmit = async (data: UpdateUserProfile) => {
    if (!user?.id) {
      console.error("No user ID available for submission");
      return;
    }

    try {
      setIsSubmitting(true);

      const updatePayload = { ...data };

      const result = await updateUserAction({
        id: user.id,
        data: updatePayload,
      });

      if (!result.success) {
        toast('Failed to update profile');
        return;
      }

      toast('Profile Updated Successfully');
      router.refresh();
    } catch (error) {
      console.error("Error in onSubmit:", error);
      toast('Failed to update profile');
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

        
        </div>
      </div>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Updating..." : "Update Profile"}
      </Button>
    </form>
  );
}