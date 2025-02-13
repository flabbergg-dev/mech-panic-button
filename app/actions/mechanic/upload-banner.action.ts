"use server"

import { createClient } from '@supabase/supabase-js'
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("Missing Supabase environment variables")
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function uploadBanner(file: File) {
  try {
    const { userId } = await auth()
    if (!userId) {
      throw new Error("Unauthorized")
    }

    // Convert File to Buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Create unique filename with sanitized userId and folder structure
    const fileExt = file.name.split(".").pop()?.toLowerCase() || 'png'
    const sanitizedUserId = userId.replace(/[^a-zA-Z0-9]/g, '')
    const fileName = `banner-${Date.now()}.${fileExt}`
    const filePath = `users/${sanitizedUserId}/banners/${fileName}`

    // Get current banner path if it exists
    const mechanic = await prisma.mechanic.findUnique({
      where: { userId },
      select: { bannerImage: true }
    })

    // Delete old banner if it exists
    if (mechanic?.bannerImage) {
      try {
        const oldUrl = new URL(mechanic.bannerImage)
        const oldPath = oldUrl.pathname.split('/images/').pop()
        if (oldPath) {
          await supabase.storage
            .from("images")
            .remove([oldPath])
        }
      } catch (error) {
        console.error("Error deleting old banner:", error)
      }
    }

    // Upload new banner
    const { data, error: uploadError } = await supabase.storage
      .from("images")
      .upload(filePath, buffer, {
        contentType: file.type || 'image/png',
        upsert: true
      })

    if (uploadError) {
      console.error("Upload error:", uploadError)
      throw new Error("Failed to upload banner")
    }

    if (!data?.path) {
      throw new Error("No path returned from upload")
    }

    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from("images")
      .getPublicUrl(data.path)

    // Update mechanic profile with new banner URL
    await prisma.mechanic.update({
      where: { userId },
      data: { bannerImage: publicUrl }
    })

    return { success: true, bannerUrl: publicUrl }
  } catch (error) {
    console.error("Error in uploadBanner:", error)
    throw error
  }
}
