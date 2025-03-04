import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { prisma } from '@/lib/prisma'
import { ServiceStatus, SubscriptionPlan, SubscriptionStatus } from '@prisma/client'
import { sendInvoiceEmail } from '@/utils/emailNotifications'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-01-27.acacia",
})

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(req: Request) {
  const body = await req.text();
  const headersList = await headers();
  const sig = headersList.get('stripe-signature');

  console.log('Received webhook body:', body);
  console.log('Received headers:', headersList);

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig!, endpointSecret);
    console.log('Webhook event verified:', event.type);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'payment_intent.created': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        console.log('Payment intent created:', paymentIntent)
        
        // Store the payment intent ID with the service request
        const serviceRequest = await prisma.serviceRequest.findFirst({
          where: { id: paymentIntent.metadata.serviceRequestId as string }
        })

        if (serviceRequest) {
          await prisma.serviceRequest.update({
            where: { id: serviceRequest.id },
            data: {
              paymentHoldId: paymentIntent.id
            }
          })
        }
        break
      }

      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        console.log('Payment intent succeeded:', paymentIntent)
        
        // Find service request with this payment hold ID
        const serviceRequest = await prisma.serviceRequest.findFirst({
          where: { paymentHoldId: paymentIntent.id }
        })

        if (serviceRequest) {
          // Update service request status to PAYMENT_AUTHORIZED
          await prisma.serviceRequest.update({
            where: { id: serviceRequest.id },
            data: {
              status: ServiceStatus.PAYMENT_AUTHORIZED,
              lastTransactionId: paymentIntent.latest_charge as string
            }
          })
        }
        break
      }
      
      case 'checkout.session.completed': {
        const session = await stripe.checkout.sessions.retrieve(
          event.data.object.id, {
            expand: ['line_items']
          }
        );

        let customerEmail = null;

        const customerId = session.customer as string;
        if(customerId) {
          const customer = await stripe.customers.retrieve(customerId);
          console.log('Customer:', customer);
          if (!customer.deleted) {
            customerEmail = (customer as Stripe.Customer).email;
          }
        }

        const subscription = await stripe.subscriptions.retrieve(
          (event.data.object as Stripe.Checkout.Session).subscription as string
        );

        const product = await stripe.products.retrieve(subscription.items.data[0].price.product as string);

        let planName = null

        if(product.name.includes('BASIC')) {
          planName = 'BASIC';
        } else if(product.name.includes('PRO')) {
          planName = 'PRO';
        } else {
          planName = null;
        }

        const invoice = await stripe.invoices.retrieve(subscription.latest_invoice as string);

        await prisma.user.update({
          where: { email: customerEmail! },
          data: {
            stripeSubscriptionId: subscription.id,
            stripeSubscriptionPlan: planName as SubscriptionPlan,
            stripeSubscriptionStatus: subscription.id ? 'ACTIVE' as SubscriptionStatus : null
          }
        });

        // send invoice to customer
        await sendInvoiceEmail({
          to: customerEmail!,
          subject: 'Mech-Panic Button Invoice',
          message: 'Thank you for subscribing to Mech-Panic Button. Your subscription is now active.',
          userName: customerEmail!,
          link: invoice.hosted_invoice_url!
        });

        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = await stripe.subscriptions.retrieve(
          event.data.object.id
        );

        console.log('Subscription deleted:', subscription);

        if (event) {
          await prisma.user.update({
            where: { email: "gregor.gr20@gmail.com" },
            data: {
              stripeSubscriptionId: null,
              stripeSubscriptionPlan: null,
              stripeSubscriptionStatus: 'CANCELED' as SubscriptionStatus
            }
          });

          console.log('User subscription revoked');
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('Error processing webhook:', err);
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}