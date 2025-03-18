import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { headers } from 'next/headers';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY

if (!stripeSecretKey) {
  throw new Error('Stripe secret key not found')
}

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2025-01-27.acacia",
})

export async function POST(request: Request) {
  try {
    const { serviceRequestId, amount, userId, mechanicConnectId, isAdditionalService, offerId } = await request.json()
    const headersList = await headers()
    const origin = headersList.get('origin')

    const data = [
      {
      price: amount,
      name: isAdditionalService ? 'Additional Service' : 'Service Offer',
      smallDescription: isAdditionalService ? 'Additional Service during repair' : 'Initial Service Offer',
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
          destination: mechanicConnectId, // mechanicConnectId as string
        },
        metadata: {
          serviceRequestId,
          userId,
          offerId,
        },
      },
      metadata: {
        serviceRequestId, // Add metadata to the session itself
        offerId,
      },
      return_url: `${origin}/dashboard/customer/${userId}?session_id={CHECKOUT_SESSION_ID}`,
      ui_mode: 'embedded',
        // automatic_tax: {enabled: true},
      // success_url:
      //   `${origin}/payment/success`,
      // cancel_url:
      //   `${origin}/payment/cancel`
    });

    return NextResponse.json({
      sessionId: session.id,
      clientSecret: session.client_secret
    })
  } catch (error) {
    console.error('Payment session creation error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create payment session' },
      { status: 500 }
    )
  }
}
