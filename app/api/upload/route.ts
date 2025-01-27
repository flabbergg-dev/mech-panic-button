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
    const file = formData.get("file") as File
    const userId = formData.get("userId") as string
    const type = formData.get("type") as "profile" | "document"

    if (!file || !userId || !type) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Get current file path if it exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { profileImage: true }
    })

    const bucket = type === "profile" ? "images" : "documents"

    // Delete old file if it exists
    if (user?.profileImage) {
      const oldPath = new URL(user.profileImage).pathname.split('/').pop()
      if (oldPath) {
        await supabase.storage
          .from(bucket)
          .remove([`${userId}/${oldPath}`])
      }
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const fileExt = file.name.split(".").pop()
    const fileName = `${Date.now()}.${fileExt}`
    const filePath = `${userId}/${fileName}`

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: true
      })

    if (error) {
      console.error("Supabase upload error:", error)
      throw error
    }

    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path)

    return NextResponse.json({ url: publicUrl })
  } catch (error) {
    console.error("Error uploading file:", error)
    return NextResponse.json(
      { error: "Error uploading file" },
      { status: 500 }
    )
  }
}
