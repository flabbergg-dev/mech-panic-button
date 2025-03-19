"use server"

import { createClient } from '@supabase/supabase-js'
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("Missing Supabase environment variables")
}
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(
  supabaseUrl,
  supabaseServiceRoleKey
)

export async function uploadDocuments(userId: string, driversLicense: File | null, merchantDocument: File | null, onUploadProgress?: (progressEvent: ProgressEvent) => void) {
  try {
    const { userId: authorizedUser } = await auth()
    
    if (!authorizedUser) {
      throw new Error("Unauthorized")
    }

    if (!userId || (!driversLicense && !merchantDocument)) {
      throw new Error("Missing userId or no documents provided")
    }

    // Check file sizes before processing
    const MAX_SIZE = 5 * 1024 * 1024; // 5MB to stay well below the Next.js limit
    
    if (driversLicense && driversLicense.size > MAX_SIZE) {
      return { success: false, error: "Driver's license file exceeds size limit (5MB)" };
    }

    if (merchantDocument && merchantDocument.size > MAX_SIZE) {
      return { success: false, error: "Merchant document file exceeds size limit (5MB)" };
    }

    // Get current document paths if they exist
    const mechanic = await prisma.mechanic.findUnique({
      where: { userId },
      select: { driversLicenseId: true, merchantDocumentUrl: true }
    })

    if (!mechanic) {
      throw new Error("Mechanic not found")
    }

    // Helper functions to delete old files and upload new ones
    const deleteOldFile = async (url: string | null) => {
      if (url) {
        const oldPath = url.split('documents/')[1]
        if (oldPath) {
          await supabase.storage.from("documents").remove([oldPath])
        }
      }
    }

    const uploadFile = async (file: File, prefix: string) => {
        try {
          const bytes = await file.arrayBuffer();
          const buffer = Buffer.from(bytes);
          const fileExt = file.name.split(".").pop();
          const fileName = `${prefix}-${Date.now()}.${fileExt}`;
          const filePath = `${userId}/${fileName}`;
      
          // Implement progress tracking
          const { data, error } = await supabase.storage
            .from("documents")
            .upload(filePath, buffer, {
              contentType: file.type,
              upsert: true,
            });
      
          if (error) {
            throw error;
          }
      
          return `documents/${filePath}`;
        } catch (error) {
          console.error("Error in uploadFile:", error);
          throw error;
        }
      };

    let driversLicenseId = mechanic.driversLicenseId
    let merchantDocumentUrl = mechanic.merchantDocumentUrl

    if (driversLicense) {
      await deleteOldFile(mechanic.driversLicenseId)
      driversLicenseId = await uploadFile(driversLicense, "drivers-license")
    }

    if (merchantDocument) {
      await deleteOldFile(mechanic.merchantDocumentUrl)
      merchantDocumentUrl = await uploadFile(merchantDocument, "merchant-doc")
    }

    await prisma.mechanic.update({
      where: { userId },
      data: {
        ...(driversLicenseId && { driversLicenseId }),
        ...(merchantDocumentUrl && { merchantDocumentUrl })
      }
    })

    return { success: true, driversLicenseId, merchantDocumentUrl }
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  } catch (error: any) {
    console.error("Error uploading documents:", error)
    
    // Check for file size limit errors
    if (error?.statusCode === 413 || 
        (error instanceof Error && 
         (error.message.includes("Body exceeded") || 
          error.message.includes("size limit") ||
          error.message.includes("413")))) {
      return { 
        success: false, 
        error: "File size exceeds the server limit. Please upload a smaller file (under 2MB)." 
      };
    }
    
    return { success: false, error: "Failed to upload documents" };
  }
}