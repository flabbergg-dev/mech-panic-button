import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      console.log('No user ID found in role request')
      return NextResponse.json({ role: null }, { status: 401 })
    }

    console.log('Fetching role for user:', userId)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    })

    console.log('Found user role:', user?.role)
    return NextResponse.json({ role: user?.role || null })
  } catch (error) {
    console.error('Error fetching user role:', error)
    return NextResponse.json({ role: null }, { status: 500 })
  }
}
