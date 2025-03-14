'use server'

import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    return NextResponse.json({ authenticated: true, userId })
  } catch (error) {
    console.error('Error in auth check:', error)
    return new NextResponse(`Internal Server Error: ${error instanceof Error ? error.message : 'Unknown error'}`, { status: 500 })
  }
}
