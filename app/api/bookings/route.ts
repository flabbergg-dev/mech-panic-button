import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const bookings = await prisma.booking.findMany({
      where: {
        mechanicId: userId,
        scheduledEnd: {
          gte: new Date()
        }
      },
      include: {
        service: true
      },
      orderBy: {
        scheduledStart: 'asc'
      }
    })

    return NextResponse.json(bookings)
  } catch (error) {
    console.error('[BOOKINGS_GET]', error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
