import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { prisma } from "@/lib/prisma"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const driversLicense = formData.get("driversLicense") as File | null
    const merchantDocument = formData.get("merchantDocument") as File | null
    const userId = formData.get("userId") as string

    if (!userId || (!driversLicense && !merchantDocument)) {
      return NextResponse.json(
        { error: "Missing userId or no documents provided" },
        { status: 400 }
      )
    }

    // Get current document paths if they exist
    const mechanic = await prisma.mechanic.findUnique({
      where: { userId },
      select: { driversLicenseId: true, merchantDocumentUrl: true }
    })

    if (!mechanic) {
      return NextResponse.json(
        { error: "Mechanic not found" },
        { status: 404 }
      )
    }

    // Delete old files if they exist
    const deleteOldFile = async (url: string | null) => {
      if (url) {
        try {
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

      return `documents/${filePath}`
    }

    let driversLicenseId = mechanic.driversLicenseId
    let merchantDocumentUrl = mechanic.merchantDocumentUrl

    // Handle drivers license upload
    if (driversLicense) {
      if (mechanic.driversLicenseId) {
        await deleteOldFile(mechanic.driversLicenseId)
      }
      driversLicenseId = await uploadFile(driversLicense, "drivers-license")
    }

    // Handle merchant document upload
    if (merchantDocument) {
      if (mechanic.merchantDocumentUrl) {
        await deleteOldFile(mechanic.merchantDocumentUrl)
      }
      merchantDocumentUrl = await uploadFile(merchantDocument, "merchant-doc")
    }

    // Update mechanic profile with new document paths
    await prisma.mechanic.update({
      where: { userId },
      data: {
        ...(driversLicenseId && { driversLicenseId }),
        ...(merchantDocumentUrl && { merchantDocumentUrl })
      }
    })

    const hasAllDocuments = Boolean(driversLicenseId && merchantDocumentUrl)

    return NextResponse.json({
      success: true,
      driversLicenseId,
      merchantDocumentUrl,
      hasAllDocuments
    })
  } catch (error) {
    console.error("Error uploading mechanic documents:", error)
    return NextResponse.json(
      { error: "Error uploading documents" },
      { status: 500 }
    )
  }
}
