import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { role } = await req.json()
    
    // Create user in database
    const user = await prisma.user.create({
      data: {
        id: userId,
        role,
        email: "", // This will be updated with Clerk webhook
        firstName: "",
        lastName: "",
      },
    })

    // If user is a mechanic, create mechanic profile
    if (role === "Mechanic") {
      await prisma.mechanic.create({
        data: {
          userId: user.id,
        },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[USER_CREATE]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
