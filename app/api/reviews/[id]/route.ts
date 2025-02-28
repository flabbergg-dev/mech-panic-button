import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const serviceRequestId = params.id
    
    if (!serviceRequestId) {
      return NextResponse.json({ error: 'Service request ID is required' }, { status: 400 })
    }

    const review = await prisma.review.findUnique({
      where: {
        serviceRequestId
      }
    })

    return NextResponse.json(review)
  } catch (error) {
    console.error('Error fetching review:', error)
    return NextResponse.json({ error: 'Failed to fetch review' }, { status: 500 })
  }
}
