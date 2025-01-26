import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { auth } from "@clerk/nextjs/server"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string } }
) {
  try {
    // Get authenticated user
    const { userId } = await auth()
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    //todo: add admin too
    // Ensure the requested document belongs to the authenticated user
    const documentPath = params.path
    const userIdFromPath = documentPath.split('/')[0]

    if (userIdFromPath !== userId) {
      return new NextResponse("Forbidden", { status: 403 })
    }

    // Get the file from Supabase storage
    const { data, error } = await supabase.storage
      .from("documents")
      .download(documentPath)

    if (error) {
      console.error("Error downloading document:", error)
      return new NextResponse("File not found", { status: 404 })
    }

    // Convert the file to a blob and return it
    const blob = new Blob([data], { 
      type: data.type || 'application/octet-stream' 
    })

    return new NextResponse(blob, {
      headers: {
        'Content-Type': data.type || 'application/octet-stream',
        'Content-Disposition': 'inline',
        // Prevent caching of sensitive documents
        'Cache-Control': 'no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })

  } catch (error) {
    console.error("Error serving document:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
