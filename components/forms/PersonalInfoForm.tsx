"use client"

import React, { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth, useUser } from "@clerk/nextjs"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { updateUserProfileAction } from "../../app/actions/user/update-user-profile.action"
import { SignOutButton } from "@/components/Buttons/SignOutButton"
import { useUserRole } from "@/hooks/use-user-role"
import { Check, Settings } from "lucide-react"
import { Controller, useForm } from "react-hook-form"

export function PersonalInfoForm() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<
    "idle" | "success" | "error"
  >("idle")
  const { user } = useUser()
  const { getToken } = useAuth()

  const { isCustomer, isMechanic, userRole, isLoading } = useUserRole()

  // const {
  //   register,
  //   handleSubmit,
  //   control,
  //   watch,
  //   formState: { errors, isDirty, isValid },
  // } = useForm<PersonalInfoFormData>({
  //   resolver: zodResolver(personalInfoSchema),
  // })
  const SubmitError = (message: string) => new Error(message)

  // const watchDocument = watch("document")
  // const watchAvatar = watch("avatar")
  // const watchBanner = watch("banner")

  const router = useRouter()

  useEffect(() => {
    if (isCustomer) {
      router.push(`/dashboard/customer/${user?.id}/settings`)
    } else if (isMechanic) {
      router.push(`/dashboard/mechanic/${user?.id}/settings`)
    }
  }, [router, isCustomer, user, isMechanic])

  // const onSubmit = async (data: PersonalInfoFormData) => {
  //   setIsSubmitting(true)
  //   setSubmitStatus("idle")

  //   const token = await getToken({
  //     template: process.env.NEXT_PUBLIC_SUPABASE_JWT_TEMPLATE,
  //   })
  //   if (!token) {
  //     throw SubmitError("Failed to get user token")
  //   }
  //   const userProps: PersonalInfoFormData = {
  //     ...data,
  //   }

  //   console.info("Personal Info:", userProps)

  //   try {
  //     const response = await updateUserProfileAction(userProps, isMechanic)
  //     if (!response) {
  //       throw SubmitError("Failed to update personal info")
  //     }
  //     setSubmitStatus("success")
  //     router.refresh()
  //   } catch (error) {
  //     setSubmitStatus("error")
  //     console.error(error)
  //     throw SubmitError("Failed to update personal info")
  //   } finally {
  //     setIsSubmitting(false)
  //   }
  // }

  const onsubmit = () => {}

  if (!user || isCustomer === undefined) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-lg text-gray-500">Loading...</p>
      </div>
    )
  }

  return (
    <>
      <div className="flex items-center space-x-4 mb-6">
        <Avatar>
          <AvatarImage src={String(user.publicMetadata["avatar"])} />
          <AvatarFallback>
            {(user.firstName?.charAt(0) ?? "").concat(
              user.lastName?.charAt(0) ?? ""
            )}
          </AvatarFallback>
        </Avatar>
        <h2 className="text-2xl font-bold">
          {user.firstName} {user.lastName}
        </h2>
        <SignOutButton />
      </div>
      {isCustomer || isMechanic ? (
        // <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        //   <div className="hidden">
        //     <Input type="text" {...register("id")} value={user.id} />
        //   </div>
        //   {/* First Name */}
        //   <div className="space-y-2">
        //     <Input
        //       type="text"
        //       {...register("firstName")}
        //       defaultValue={user.firstName ?? ""}
        //       placeholder="First Name"
        //       className="w-full p-4 border rounded text-lg"
        //     />
        //     {errors.firstName && (
        //       <p className="text-red-500 text-sm">{errors.firstName.message}</p>
        //     )}
        //   </div>
        //   {/* Last Name */}
        //   <div className="space-y-2">
        //     <Input
        //       type="text"
        //       {...register("lastName")}
        //       defaultValue={user.lastName ?? " "}
        //       placeholder="Last Name"
        //       className="w-full p-4 border rounded text-lg"
        //     />
        //     {errors.lastName && (
        //       <p className="text-red-500 text-sm">{errors.lastName.message}</p>
        //     )}
        //   </div>
        //   {/* Email Address */}
        //   <div className="space-y-2">
        //     <Input
        //       type="email"
        //       {...register("email")}
        //       defaultValue={user.emailAddresses[0]!.emailAddress}
        //       placeholder="Email"
        //       className="w-full p-4 border rounded text-lg cursor-not-allowed bg-muted/40 text-muted-foreground"
        //       readOnly
        //     />
        //     <p className="text-xs text-muted-foreground ml-2">
        //       Email change is not available for the moment.
        //     </p>
        //     {errors.email && (
        //       <p className="text-red-500 text-sm">{errors.email.message}</p>
        //     )}
        //   </div>
        //   {/* Phone Number */}
        //   <div className="space-y-2">
        //     <Input
        //       type="tel"
        //       {...register("phoneNumber")}
        //       defaultValue={String(user?.publicMetadata?.["phoneNumber"] ?? "")}
        //       placeholder="Phone"
        //       className="w-full p-4 border rounded text-lg"
        //     />
        //     {errors.phoneNumber && (
        //       <p className="text-red-500 text-sm">
        //         {errors.phoneNumber.message}
        //       </p>
        //     )}
        //   </div>
        //   {/* Date of Birth */}
        //   <div className="space-y-2">
        //     <Input
        //       type="date"
        //       {...register("dob")}
        //       defaultValue={String(user?.publicMetadata?.["dob"] ?? "")}
        //       className="w-full p-4 border rounded text-lg"
        //     />
        //     {errors.dob && (
        //       <p className="text-red-500 text-sm">{errors.dob.message}</p>
        //     )}
        //   </div>
        //   {/* Role Selection for Customer to turn into Mechanic */}
        //   {isCustomer && (
        //     <div className="space-y-2">
        //       <Controller
        //         control={control}
        //         name="role"
        //         defaultValue={userRole || "Customer"}
        //         render={({ field }) => (
        //           <Select
        //             onValueChange={field.onChange}
        //             defaultValue={userRole || "Customer"}
        //             value={field.value}
        //             disabled={isLoading}
        //           >
        //             <SelectTrigger className="w-full p-4 border rounded text-lg">
        //               <SelectValue placeholder="Select Role">
        //                 {isLoading ? "Loading..." : field.value}
        //               </SelectValue>
        //             </SelectTrigger>
        //             <SelectContent>
        //               <SelectItem value="Customer">Customer</SelectItem>
        //               <SelectItem value="Mechanic">Mechanic</SelectItem>
        //             </SelectContent>
        //           </Select>
        //         )}
        //       />
        //       {errors.role && (
        //         <p className="text-red-500 text-sm">{errors.role.message}</p>
        //       )}
        //     </div>
        //   )}
        //   {/* Avatar Image  */}
        //   <div className="">
        //     <Label htmlFor="avatar">Avatar Image</Label>
        //     <Controller
        //       name="avatar"
        //       control={control}
        //       defaultValue={undefined}
        //       render={({ field: { onChange, value, ...field } }) => (
        //         <Input
        //           type="file"
        //           id="avatar"
        //           accept=".pdf,.doc,.docx,image/*"
        //           onChange={(e) => {
        //             const file = e.target.files?.[0]
        //             if (file) {
        //               onChange(file)
        //             }
        //           }}
        //           className="w-full p-4 border rounded text-lg"
        //           {...field}
        //         />
        //       )}
        //     />
        //     {errors.avatar && (
        //       <p className="text-red-500 text-sm">{errors.avatar.message}</p>
        //     )}
        //     {watchAvatar && (
        //       <p className="text-sm text-green-600">
        //         Selected: {(watchAvatar as File).name}
        //       </p>
        //     )}
        //   </div>
        //   {/* 
        //   Banner Image 
        //   Merchant Document
        //  */}
        //   {isMechanic && (
        //     <>
        //       <div className="">
        //         <Label htmlFor="banner">Banner Image</Label>
        //         <Controller
        //           name="banner"
        //           control={control}
        //           defaultValue={undefined}
        //           render={({ field: { onChange, value, ...field } }) => (
        //             <Input
        //               type="file"
        //               id="banner"
        //               accept=".pdf,.doc,.docx,image/*"
        //               onChange={(e) => {
        //                 const file = e.target.files?.[0]
        //                 if (file) {
        //                   onChange(file)
        //                 }
        //               }}
        //               className="w-full p-4 border rounded text-lg"
        //               {...field}
        //             />
        //           )}
        //         />
        //         {errors.banner && (
        //           <p className="text-red-500 text-sm">
        //             {errors.banner.message}
        //           </p>
        //         )}
        //         {watchBanner && (
        //           <p className="text-sm text-green-600">
        //             Selected: {(watchBanner as File).name}
        //           </p>
        //         )}
        //       </div>
        //       <div className="">
        //         <Label htmlFor="document">Merchant Document</Label>
        //         <Controller
        //           name="document"
        //           control={control}
        //           defaultValue={undefined}
        //           render={({ field: { onChange, value, ...field } }) => (
        //             <Input
        //               type="file"
        //               id="document"
        //               accept=".pdf,.doc,.docx,image/*"
        //               onChange={(e) => {
        //                 const file = e.target.files?.[0]
        //                 if (file) {
        //                   onChange(file)
        //                 }
        //               }}
        //               className="w-full p-4 border rounded text-lg"
        //               {...field}
        //             />
        //           )}
        //         />
        //         {errors.document && (
        //           <p className="text-red-500 text-sm">
        //             {errors.document.message}
        //           </p>
        //         )}
        //         {watchDocument && (
        //           <p className="text-sm text-green-600">
        //             Selected: {(watchDocument as File).name}
        //           </p>
        //         )}
        //       </div>
        //     </>
        //   )}
        //   <Button
        //     type="submit"
        //     className={`w-full px-6 py-4 rounded text-lg ${
        //       !isDirty || !isValid
        //         ? "opacity-50 cursor-not-allowed"
        //         : isSubmitting
        //           ? "bg-foreground"
        //           : "bg-primary"
        //     }`}
        //     disabled={!isDirty || !isValid || isSubmitting}
        //     aria-disabled={!isDirty || !isValid || isSubmitting}
        //   >
        //     {isSubmitting ? (
        //       <Settings className="animate-spin  bg-background" />
        //     ) : submitStatus === "success" ? (
        //       <Check className="animate-in duration-300" />
        //     ) : (
        //       "Save Changes"
        //     )}{" "}
        //   </Button>{" "}
        // </form>
        <>
        </>
      ) : (
        <div className="space-y-4">
          <div className="space-y-2 w-full h-9 animate-pulse bg-gray-200 rounded-lg"></div>
          <div className="space-y-2 w-full h-9 animate-pulse bg-gray-200 rounded-lg"></div>
          <div className="space-y-2 w-full h-9 animate-pulse bg-gray-200 rounded-lg"></div>
          <div className="space-y-2 w-full h-9 animate-pulse bg-gray-200 rounded-lg"></div>
          <div className="space-y-2 w-full h-9 animate-pulse bg-gray-200 rounded-lg"></div>
          <div className="space-y-2 w-full h-9 animate-pulse bg-gray-200 rounded-lg"></div>
          <div className="space-y-2 w-full h-9 animate-pulse bg-gray-200 rounded-lg"></div>
          <div className="space-y-2 w-full h-9 animate-pulse bg-gray-200 rounded-lg"></div>
          <div className="space-y-2 w-full h-9 animate-pulse bg-primary/20 rounded-lg"></div>
        </div>
      )}
    </>
  )
}
