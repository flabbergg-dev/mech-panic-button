import { z } from "zod"
import {type UserRole,type SubscriptionPlan,type SubscriptionStatus, ServiceType } from "@prisma/client"

// Base user schema without mechanic-specific fields
export const updateUserSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phoneNumber: z.string().optional(),
  dob: z.string()
    .refine((str) => {
      if (!str) return true; // Allow empty string
      const date = new Date(str);
      if (Number.isNaN(date.getTime())) return false; // Invalid date
      const today = new Date();
      let age = today.getFullYear() - date.getFullYear();
      const m = today.getMonth() - date.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < date.getDate())) {
        age--;
      }
      return age >= 18;
    }, "You must be at least 18 years old")
    .optional()
    .or(z.literal('')),
  currentLocation: z.any().nullable(),
 
  documentsUrl: z.array(z.string()).default([]),
})

// Additional fields for mechanics
export const updateMechanicSchema = z.object({
  bio: z.string().optional(),
  servicesOffered: z.array(z.nativeEnum(ServiceType)).optional(),
  isAvailable: z.boolean().optional(),
  bannerImage: z.instanceof(File).optional(),
  driversLicenseId: z.string().optional(),
  merchantDocumentUrl: z.string().optional(),
})

// Combined schema for mechanic users
export const updateMechanicProfileSchema = updateUserSchema.merge(updateMechanicSchema)

export type UpdateUserDTO = z.infer<typeof updateUserSchema>
export type UpdateMechanicDTO = z.infer<typeof updateMechanicProfileSchema>

export interface UserProfileEntity {
  id: string
  createdAt: Date
  updatedAt: Date
  email: string
  lastName: string
  role: UserRole | null
  firstName: string
  profileImage: string | null
  dob: Date | null
  phoneNumber: string | null
  stripeCustomerId: string | null
  stripeConnectId: string | null
  stripeSubscriptionId: string | null
  currentLocation: {latitude: number, longitude: number} | null // Json in Prisma
  stripeSubscriptionPlan: SubscriptionPlan | null
  stripeSubscriptionStatus: SubscriptionStatus | null
  documentsUrl: string[]
}

export interface MechanicProfileEntity extends UserProfileEntity {
  mechanic: {
    id: string
    bio: string | null
    servicesOffered: ServiceType[]
    isAvailable: boolean
    rating: number | null
    bannerImage: string | null
    driversLicenseId: string | null
    merchantDocumentUrl: string | null
  }
}
