import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { ServiceStatus } from '@prisma/client';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-01-27.acacia",
})

export async function POST(request: Request) {
  try {
    const { serviceRequestId, amount, userId, mechanicConnectId } = await request.json()
    const headersList = await headers()
    const origin = headersList.get('origin')
    // Create a PaymentIntent with manual capture
    // const paymentIntent = await stripe.paymentIntents.create({
    //   amount: Math.round(amount * 100), // Convert to cents
    //   currency: 'usd',
    //   capture_method: 'manual', // This enables the payment hold
    //   metadata: {
    //     serviceRequestId,
    //   },
    // })

    const data = [
      {
      price: amount,
      name: 'Service Offer',
      smallDescription: 'Service Offer',
      images: ['https://via.placeholder.com/150'],
      }
    ]

    const session = await stripe.checkout.sessions.create({
      // payment_method_types: ['card'],
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd",
            unit_amount: Math.round((data[0]?.price as number) * 100),
            product_data: {
              name: data[0]?.name as string,
              description: data[0]?.smallDescription,
              images: data[0]?.images,
            },
          },
          quantity: 1,
        },
      ],
      payment_intent_data: {
        application_fee_amount: Math.round((data[0]?.price as number) * 100) * 0.1,
        transfer_data: {
          destination: 'acct_1QuI5YGgvb4NdUsj', // mechanicConnectId as string
        },
        metadata: {
          serviceRequestId,
        },
      },
      metadata: {
        serviceRequestId, // Add metadata to the session itself
      },
      return_url: `${origin}/dashboard/customer/${userId}?session_id={CHECKOUT_SESSION_ID}`,
      ui_mode: 'embedded',
        // automatic_tax: {enabled: true},
      // success_url:
      //   `${origin}/payment/success`,
      // cancel_url:
      //   `${origin}/payment/cancel`
    });

    return NextResponse.json({ success: true, sessionDetails: session, sessionId: session.id, sessionSecret: session.client_secret })
  } catch (error) {
    console.error('Payment session creation error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create payment session' },
      { status: 500 }
    )
  }
}
