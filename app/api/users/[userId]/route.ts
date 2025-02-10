import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const user = await prisma.user.findUnique({
      where: {
        id: params.userId,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phoneNumber: true,
        role: true,
        profileImage: true,
        documentsUrl: true,
        dob: true,
        currentLocation: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    if (!user) {
      return new NextResponse("User not found", { status: 404 })
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error("[USER_GET]", error)
    return new NextResponse("Internal error", { status: 500 })
  }
}
