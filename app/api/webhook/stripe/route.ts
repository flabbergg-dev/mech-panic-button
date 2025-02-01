import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { prisma } from '@/lib/prisma'
import { ServiceStatus } from '@prisma/client'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-01-27.acacia",
})

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(req: Request) {
  const body = await req.text()
  const headersList = await headers()
  const sig = headersList.get('stripe-signature')

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, sig!, endpointSecret)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'payment_intent.created': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        
        // Find service request with this payment hold ID
        const serviceRequest = await prisma.serviceRequest.findFirst({
          where: { paymentHoldId: paymentIntent.id }
        })

        if (serviceRequest) {
          // Update service request status to PAYMENT_AUTHORIZED
          await prisma.serviceRequest.update({
            where: { id: serviceRequest.id },
            data: { 
              status: ServiceStatus.PAYMENT_AUTHORIZED
            }
          })
        }
        break
      }
      // Add other webhook events as needed
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Error processing webhook:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}