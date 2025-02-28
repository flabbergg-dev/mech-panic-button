import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const serviceRequestId = request.nextUrl.searchParams.get('serviceRequestId');
    
    if (!serviceRequestId) {
      return NextResponse.json({ error: 'Service request ID is required' }, { status: 400 });
    }
    
    // Check if a review exists for this service request
    const review = await prisma.review.findUnique({
      where: {
        serviceRequestId,
      },
    });
    
    return NextResponse.json({ hasReview: !!review });
  } catch (error) {
    console.error('Error checking for review:', error);
    return NextResponse.json({ error: 'Failed to check for review' }, { status: 500 });
  }
}
