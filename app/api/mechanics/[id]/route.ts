import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const mechanicId = params.id
    
    if (!mechanicId) {
      return NextResponse.json({ error: 'Mechanic ID is required' }, { status: 400 })
    }

    const mechanic = await prisma.mechanic.findUnique({
      where: {
        id: mechanicId
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      }
    })

    if (!mechanic) {
      return NextResponse.json({ error: 'Mechanic not found' }, { status: 404 })
    }

    // Return user info if available, otherwise just the mechanic
    if (mechanic.user) {
      return NextResponse.json({
        id: mechanic.id,
        firstName: mechanic.user.firstName,
        lastName: mechanic.user.lastName
      })
    }

    return NextResponse.json({ id: mechanic.id })
  } catch (error) {
    console.error('Error fetching mechanic:', error)
    return NextResponse.json({ error: 'Failed to fetch mechanic' }, { status: 500 })
  }
}
