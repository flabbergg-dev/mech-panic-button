import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { prisma } from '@/lib/prisma'
import { ServiceStatus } from '@prisma/client'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-01-27.acacia",
})

export async function POST(request: Request) {
  try {
    const { serviceRequestId, amount, userId } = await request.json()

    // Create a PaymentIntent with manual capture
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: 'usd',
      capture_method: 'manual', // This enables the payment hold
      metadata: {
        serviceRequestId,
      },
    })

    // Create Stripe checkout session with the PaymentIntent
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      payment_intent_data: {
        capture_method: 'manual',
      },
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Mechanic Service',
              description: `Service Request #${serviceRequestId}`,
            },
            unit_amount: Math.round(amount * 100),
          },
          quantity: 1,
        },
      ],
      success_url: new URL(
        `/dashboard/customer/${userId}`,
        process.env.NEXT_PUBLIC_APP_URL
      ).toString() + '?' + new URLSearchParams({
        tab: 'map',
        payment: 'authorized'
      }).toString(),
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/customer/${userId}`,
      metadata: {
        serviceRequestId,
      },
    })

    // Update the service request with the payment hold ID
    await prisma.serviceRequest.update({
      where: { id: serviceRequestId },
      data: {
        paymentHoldId: paymentIntent.id,
        status: ServiceStatus.PAYMENT_AUTHORIZED,
      },
    })

    return NextResponse.json({ success: true, sessionId: session.id })
  } catch (error) {
    console.error('Payment session creation error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create payment session' },
      { status: 500 }
    )
  }
}
