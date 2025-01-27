import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { prisma } from "@/lib/prisma"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const driversLicense = formData.get("driversLicense") as File
    const merchantDocument = formData.get("merchantDocument") as File
    const userId = formData.get("userId") as string

    if (!driversLicense || !merchantDocument || !userId) {
      return NextResponse.json(
        { error: "Missing required files" },
        { status: 400 }
      )
    }

    // Get current document paths if they exist
    const mechanic = await prisma.mechanic.findUnique({
      where: { userId },
      select: { driversLicenseId: true, merchantDocumentUrl: true }
    })

    // Delete old files if they exist
    if (mechanic) {
      const oldFiles = [
        mechanic.driversLicenseId,
        mechanic.merchantDocumentUrl
      ].filter(Boolean)

      for (const url of oldFiles) {
        if (url) {
          try {
            // Extract just the path part from the stored location
            const oldPath = url.split('documents/')[1]
            if (oldPath) {
              await supabase.storage
                .from("documents")
                .remove([oldPath])
            }
          } catch (error) {
            console.error("Error deleting old file:", error)
          }
        }
      }
    }

    // Upload new files
    const uploadFile = async (file: File, prefix: string) => {
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)
      const fileExt = file.name.split(".").pop()
      const fileName = `${prefix}-${Date.now()}.${fileExt}`
      const filePath = `${userId}/${fileName}`

      const { data, error } = await supabase.storage
        .from("documents")
        .upload(filePath, buffer, {
          contentType: file.type,
          upsert: true
        })

      if (error) {
        console.error(`Error uploading ${prefix}:`, error)
        throw error
      }

      // Return the storage path instead of public URL
      return `documents/${filePath}`
    }

    // Upload both documents
    const [driversLicenseId, merchantDocumentUrl] = await Promise.all([
      uploadFile(driversLicense, "drivers-license"),
      uploadFile(merchantDocument, "merchant-doc")
    ])

    // Update mechanic profile with new document paths
    await prisma.mechanic.update({
      where: { userId },
      data: {
        driversLicenseId,
        merchantDocumentUrl
      }
    })

    return NextResponse.json({
      success: true,
      driversLicenseId,
      merchantDocumentUrl
    })
  } catch (error) {
    console.error("Error uploading mechanic documents:", error)
    return NextResponse.json(
      { error: "Error uploading documents" },
      { status: 500 }
    )
  }
}
