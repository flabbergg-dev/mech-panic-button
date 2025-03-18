import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { prisma } from '@/lib/prisma'
import { ServiceStatus, type SubscriptionPlan, type SubscriptionStatus, OfferStatus } from '@prisma/client'
import { sendInvoiceEmail } from '@/utils/emailNotifications'

/**
 * Required environment variables:
 * - STRIPE_SECRET_KEY: Stripe API secret key for server-side operations
 * - STRIPE_WEBHOOK_SECRET: Stripe webhook signing secret for verifying webhook authenticity
 */

// Validate environment variables using our standard pattern
function validateEnv<T extends string>(value: string | undefined, name: string): T {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value as T
}

const stripeSecretKey = validateEnv<string>(process.env.STRIPE_SECRET_KEY, 'STRIPE_SECRET_KEY')
const stripeWebhookSecret = validateEnv<string>(process.env.STRIPE_WEBHOOK_SECRET, 'STRIPE_WEBHOOK_SECRET')

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2025-01-27.acacia",
})

export async function POST(req: Request) {
  try {
    // Parallelize async operations for better performance
    const [body, headersList] = await Promise.all([
      req.text(),
      headers()
    ]).catch(error => {
      console.error('Failed to read request:', error)
      throw new Error('Failed to process webhook request')
    })
    
    const signature = headersList.get('stripe-signature')
    if (!signature) {
      return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
    }

    let event: Stripe.Event
    try {
      event = stripe.webhooks.constructEvent(body, signature, stripeWebhookSecret)
    } catch (err) {
      console.error('Webhook signature verification failed:', err)
      return NextResponse.json({ error: (err as Error).message }, { status: 400 })
    }

    try {
      switch (event.type) {
        case 'payment_intent.created': {
          const paymentIntent = event.data.object as Stripe.PaymentIntent
          const serviceRequestId = paymentIntent.metadata.serviceRequestId

          if (!serviceRequestId) {
            throw new Error('Missing serviceRequestId in payment intent metadata')
          }

          const serviceRequest = await prisma.serviceRequest.findUnique({
            where: { id: serviceRequestId }
          })

          if (serviceRequest) {
            await prisma.serviceRequest.update({
              where: { id: serviceRequest.id },
              data: { paymentHoldId: paymentIntent.id }
            })
          }
          break
        }

        case 'payment_intent.succeeded': {
          const paymentIntent = event.data.object as Stripe.PaymentIntent
          const serviceRequestId = paymentIntent.metadata.serviceRequestId

          if (!serviceRequestId) {
            throw new Error('Missing serviceRequestId in payment intent metadata')
          }

          const [serviceOffer, serviceRequest] = await Promise.all([
            prisma.serviceOffer.findFirst({
              where: { serviceRequestId }
            }),
            prisma.serviceRequest.findUnique({
              where: { id: serviceRequestId }
            })
          ])

          if (!serviceRequest) {
            throw new Error('Service request not found')
          }

          if (!serviceRequest.clientId) {
            throw new Error('Service request has no client ID')
          }

          const id = paymentIntent.id as string
          if (!id) {
            throw new Error('No charge ID found in payment intent')
          }

          if (serviceRequest.firstTransactionId === null) {
            // This is the first transaction - change status to PAYMENT_AUTHORIZED
            await prisma.serviceRequest.update({
              where: { id: serviceRequest.id },
              data: {
                status: ServiceStatus.PAYMENT_AUTHORIZED,
                totalAmount: serviceOffer?.price,
                firstTransactionId: id
              }
            })
          } else {
            // Find and update the specific offer that was paid for
            const offerId = paymentIntent.metadata.serviceRequestId
            let offerToUpdate = null;
            
            if (offerId) {
              // Get the offer by its ID from metadata
              offerToUpdate = await prisma.serviceOffer.findUnique({
                where: { id: offerId }
              });
              
              // If found, update its status
              if (offerToUpdate) {
                await prisma.serviceOffer.update({
                  where: { id: offerId },
                  data: { status: OfferStatus.ACCEPTED }
                });
                console.log(`Updated offer ${offerId} to ACCEPTED`);
              }
            } 
            
            // If no offer was found by ID, try to find one by service request ID
            if (!offerToUpdate) {
              // Fallback to find the most recent pending offer for this request
              const pendingOffer = await prisma.serviceOffer.findFirst({
                where: { 
                  serviceRequestId: serviceRequestId,
                  status: OfferStatus.PENDING
                },
                orderBy: { createdAt: 'desc' }
              });
              
              if (pendingOffer) {
                await prisma.serviceOffer.update({
                  where: { id: pendingOffer.id },
                  data: { status: OfferStatus.ACCEPTED }
                });
                console.log(`Updated fallback offer ${pendingOffer.id} to ACCEPTED`);
              } else {
                console.log(`No pending offers found for service request ${serviceRequestId}`);
              }
            }

            // For second transaction, keep the service request in SERVICING status
            await prisma.serviceRequest.update({
              where: { id: serviceRequest.id },
              data: {
                // Only update status if not already in SERVICING or further state
                ...(serviceRequest.status !== ServiceStatus.SERVICING && 
                   serviceRequest.status !== ServiceStatus.IN_PROGRESS && 
                   serviceRequest.status !== ServiceStatus.COMPLETED && {
                  status: ServiceStatus.SERVICING
                }),
                totalAmount: serviceRequest.totalAmount + (serviceOffer?.price || 0),
                secondTransactionId: id
              }
            })
          }

          const user = await prisma.user.findUnique({
            where: { id: serviceRequest.clientId }
          })

          if (user) {
            await prisma.user.update({
              where: { id: serviceRequest.clientId },
              data: {
                [user.firstTransactionId ? 'secondTransactionId' : 'firstTransactionId']: id
              }
            })
          }
          break
        }

        case 'checkout.session.completed': {
          const session = await stripe.checkout.sessions.retrieve(
            event.data.object.id,
            { expand: ['line_items'] }
          )

          const customerId = session.customer as string
          if (!customerId) {
            throw new Error('No customer ID in session')
          }

          const customer = await stripe.customers.retrieve(customerId)
          if (customer.deleted) {
            throw new Error('Customer was deleted')
          }

          const customerEmail = (customer as Stripe.Customer).email
          if (!customerEmail) {
            throw new Error('No customer email found')
          }

          const subscriptionId = (event.data.object as Stripe.Checkout.Session).subscription as string
          if (subscriptionId) {
            const subscription = await stripe.subscriptions.retrieve(subscriptionId)
            const product = await stripe.products.retrieve(
              subscription.items.data[0].price.product as string
            )

            const planName: SubscriptionPlan | null = 
              product.name.includes('BASIC') ? 'BASIC' :
              product.name.includes('PRO') ? 'PRO' : 
              null

            const invoice = await stripe.invoices.retrieve(subscription.latest_invoice as string)
            if (!invoice.hosted_invoice_url) {
              throw new Error('No invoice URL found')
            }

            await prisma.user.update({
              where: { email: customerEmail },
              data: {
                stripeSubscriptionId: subscription.id,
                stripeCustomerId: customerId,
                stripeSubscriptionPlan: planName,
                stripeSubscriptionStatus: subscription.id ? 'ACTIVE' as SubscriptionStatus : null,
                stripeSubEndingDate: new Date(new Date().setMonth(new Date().getMonth() + 1))
              }
            })

            await sendInvoiceEmail({
              to: customerEmail,
              subject: 'Mech-Panic Button Invoice',
              message: 'Thank you for subscribing to Mech-Panic Button. Your subscription is now active.',
              userName: customerEmail,
              link: invoice.hosted_invoice_url
            })
          }
          break
        }

        case 'customer.subscription.deleted': {
          const subscriptionId = event.data.object.id
          const customerId = event.data.object.customer as string

          if (!customerId) {
            throw new Error('No customer ID in subscription')
          }

          const user = await prisma.user.findFirst({
            where: { stripeCustomerId: customerId }
          })

          if (!user?.email) {
            throw new Error('User not found or has no email')
          }

          await prisma.user.update({
            where: { email: user.email },
            data: {
              stripeSubscriptionId: null,
              stripeSubscriptionPlan: null,
              stripeSubscriptionStatus: 'CANCELED' as SubscriptionStatus
            }
          })

          console.log('User subscription revoked')
          break
        }

        default:
          console.log(`Unhandled event type: ${event.type}`)
      }

      return NextResponse.json({ received: true })
    } catch (err) {
      console.error('Error processing webhook:', err)
      return NextResponse.json(
        { error: (err as Error).message },
        { status: 400 }
      )
    }
  } catch (err) {
    console.error('Error handling request:', err)
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    )
  }
}