import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { prisma } from '@/lib/prisma'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-01-27.acacia",
})

export async function POST(request: Request) {
  try {
    const { serviceRequestId } = await request.json()

    // Get the service request with the payment hold ID
    const serviceRequest = await prisma.serviceRequest.findUnique({
      where: { id: serviceRequestId },
    })

    if (!serviceRequest?.paymentHoldId) {
      throw new Error('No payment hold found for this service request')
    }

    // Capture the authorized payment
    const payment = await stripe.paymentIntents.capture(
      serviceRequest.paymentHoldId
    )

    // Update the service request with the captured payment ID
    await prisma.serviceRequest.update({
      where: { id: serviceRequestId },
      data: {
        paymentId: payment.id,
        status: 'COMPLETED',
      },
    })

    return NextResponse.json({ success: true, paymentId: payment.id })
  } catch (error) {
    console.error('Payment capture error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to capture payment' },
      { status: 500 }
    )
  }
}
