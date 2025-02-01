import { createClient } from "@supabase/supabase-js"
import {
  UpdateUserDTO,
  UpdateMechanicDTO,
  UserProfileEntity,
  MechanicProfileEntity,
} from "@/lib/domain/dtos/user.dto"
import { IUserRepository } from "@/lib/domain/repositories/user.repository"
import { prisma } from "@/lib/prisma"
import { ServiceType } from "@prisma/client"

export class PrismaUserRepository implements IUserRepository {
  private supabase
  private buckets = {
    images: "images",
    documents: "documents"
  }

  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
  }

  async getUserProfile(userId: string): Promise<UserProfileEntity | null> {
    return prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        createdAt: true,
        updatedAt: true,
        email: true,
        lastName: true,
        role: true,
        firstName: true,
        profileImage: true,
        dob: true,
        phoneNumber: true,
        stripeCustomerId: true,
        stripeSubscriptionId: true,
        currentLocation: true,
       
        stripeSubscriptionPlan: true,
        stripeSubscriptionStatus: true,
        documentsUrl: true,
      },
    })
  }

  async getMechanicProfile(userId: string): Promise<MechanicProfileEntity | null> {
    const profile = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        createdAt: true,
        updatedAt: true,
        email: true,
        lastName: true,
        role: true,
        firstName: true,
        profileImage: true,
        dob: true,
        phoneNumber: true,
        stripeCustomerId: true,
        stripeSubscriptionId: true,
        currentLocation: true,
        
        stripeSubscriptionPlan: true,
        stripeSubscriptionStatus: true,
        documentsUrl: true,
        mechanic: {
          select: {
            id: true,
            bio: true,
            servicesOffered: true,
            isAvailable: true,
            rating: true,
            bannerImage: true,
            driversLicenseId: true,
            merchantDocumentUrl: true,
          }
        }
      },
    })

    if (!profile || !profile.mechanic) {
      return null
    }

    return {
      ...profile,
      mechanic: profile.mechanic
    } as MechanicProfileEntity
  }

  async updateUserProfile(
    userId: string,
    data: UpdateUserDTO
  ): Promise<UserProfileEntity> {
    try {
      const { documentsUrl, currentLocation,  dob, ...userData } = data

      // Handle date conversion
      const dobDate = dob ? new Date(dob) : null

      // Update user data in Prisma
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          ...userData,
          dob: dobDate,
          currentLocation: currentLocation || null,
          
          documentsUrl: documentsUrl || [],
        },
        select: {
          id: true,
          createdAt: true,
          updatedAt: true,
          email: true,
          lastName: true,
          role: true,
          firstName: true,
          profileImage: true,
          dob: true,
          phoneNumber: true,
          stripeCustomerId: true,
          stripeSubscriptionId: true,
          currentLocation: true,
         
          stripeSubscriptionPlan: true,
          stripeSubscriptionStatus: true,
          documentsUrl: true,
        },
      })

      return updatedUser
    } catch (error) {
      console.error('Error in updateUserProfile:', error)
      throw error
    }
  }

  async updateMechanicProfile(
    userId: string,
    data: UpdateMechanicDTO
  ): Promise<MechanicProfileEntity> {
    try {
      const {
        bio,
        servicesOffered,
        isAvailable,
        bannerImage,
        driversLicenseId,
        merchantDocumentUrl,
        documentsUrl,
        currentLocation,
        
        dob,
        ...userData
      } = data

      // Handle date conversion
      const dobDate = dob ? new Date(dob) : null

      // Upload documents if provided
      const uploadedDocs = bannerImage ? 
        await this.uploadMechanicDocuments(userId, { bannerImage }) : 
        {}

      // Update in transaction to ensure consistency
      // This is important because we are updating both the User and Mechanic
      // tables in a single operation, and we want to ensure that either
      // both updates succeed or neither does (i.e. we don't want to end
      // up in a state where the User table is updated but the Mechanic
      // table is not, or vice versa).
      const updatedProfile = await prisma.$transaction(async (tx) => {
        // Update user data
        // We are not updating the profileImage here because it is handled
        // separately in the uploadProfileImage method.
        const user = await tx.user.update({
          where: { id: userId },
          data: {
            // Update user data
            ...userData,
            // Convert dob to Date object
            dob: dobDate,
            // Set currentLocation and serviceArea to null if not provided
            currentLocation: currentLocation || null,
            
            // Set documentsUrl to an empty array if not provided
            documentsUrl: documentsUrl || [],
          },
          select: {
            id: true,
            createdAt: true,
            updatedAt: true,
            email: true,
            lastName: true,
            role: true,
            firstName: true,
            profileImage: true,
            dob: true,
            phoneNumber: true,
            stripeCustomerId: true,
            stripeSubscriptionId: true,
            currentLocation: true,
           
            stripeSubscriptionPlan: true,
            stripeSubscriptionStatus: true,
            documentsUrl: true,
          },
        })

        // Update mechanic data
        // We are updating the Mechanic table here because we have
        // additional fields that are specific to mechanics.
        const mechanic = await tx.mechanic.upsert({
          where: { userId },
          create: {
            // Create a new Mechanic record if one does not exist
            userId,
            bio: bio || null,
            servicesOffered: servicesOffered || [],
            isAvailable: isAvailable || false,
            bannerImage: uploadedDocs.bannerImage || null,
            driversLicenseId: driversLicenseId || null,
            merchantDocumentUrl: merchantDocumentUrl || null,
          },
          update: {
            // Update the Mechanic record if one already exists
            bio: bio || null,
            servicesOffered: servicesOffered || [],
            isAvailable: isAvailable || false,
            // Set bannerImage to null if not provided
            ...(uploadedDocs.bannerImage && { bannerImage: uploadedDocs.bannerImage }),
            // Set driversLicenseId to null if not provided
            ...(driversLicenseId && { driversLicenseId }),
            // Set merchantDocumentUrl to null if not provided
            ...(merchantDocumentUrl && { merchantDocumentUrl }),
          },
          select: {
            id: true,
            bio: true,
            servicesOffered: true,
            isAvailable: true,
            rating: true,
            bannerImage: true,
            driversLicenseId: true,
            merchantDocumentUrl: true,
          }
        })

        return {
          ...user,
          mechanic,
        } as MechanicProfileEntity
      })

      return updatedProfile
    } catch (error) {
      console.error('Error in updateMechanicProfile:', error)
      throw error
    }
  }

  async uploadProfileImage(userId: string, file: File): Promise<string> {
    try {
      const fileExt = file.name.split(".").pop()
      const fileName = `${userId}/profile-${Date.now()}.${fileExt}`

      const { data, error } = await this.supabase.storage
        .from(this.buckets.images)
        .upload(fileName, file, {
          upsert: true,
        })

      if (error) throw error

      const { data: { publicUrl } } = this.supabase.storage
        .from(this.buckets.images)
        .getPublicUrl(data.path)

      return publicUrl
    } catch (error) {
      console.error("Error uploading profile image:", error)
      throw new Error("Failed to upload profile image")
    }
  }

  async uploadMechanicDocuments(
    userId: string,
    files: { [key: string]: File }
  ): Promise<{
    bannerImage?: string
    driversLicenseId?: string
    merchantDocumentUrl?: string
  }> {
    try {
      const result: {
        bannerImage?: string
        driversLicenseId?: string
        merchantDocumentUrl?: string
      } = {}

      for (const [key, file] of Object.entries(files)) {
        const fileExt = file.name.split(".").pop()
        const fileName = `${userId}/${key}-${Date.now()}.${fileExt}`

        const { data, error } = await this.supabase.storage
          .from(this.buckets.documents)
          .upload(fileName, file, {
            upsert: true,
          })

        if (error) throw error

        const { data: { publicUrl } } = this.supabase.storage
          .from(this.buckets.documents)
          .getPublicUrl(data.path)

        result[key as keyof typeof result] = publicUrl
      }

      return result
    } catch (error) {
      console.error("Error uploading mechanic documents:", error)
      throw new Error("Failed to upload mechanic documents")
    }
  }
}
