import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ role: null }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    })

    return NextResponse.json({ role: user?.role || null })
  } catch (error) {
    console.error('Error fetching user role:', error)
    return NextResponse.json({ role: null }, { status: 500 })
  }
}
