import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { prisma } from '@/lib/prisma'
import { ServiceStatus, SubscriptionPlan, SubscriptionStatus } from '@prisma/client'
import { sendInvoiceEmail } from '@/utils/emailNotifications'

// deprecated
// export const config = {
//   api: {
//     bodyParser: false,
//   },
// };

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-01-27.acacia",
})

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(req: Request) {
  const body = await req.text();
  const headersList = await headers();
  const sig = headersList.get('stripe-signature');

  // console.log('Received webhook body:', body);
  // console.log('Received headers:', headersList);
  for (const [key, value] of headersList.entries()) {
  console.log(`${key}: ${value}`);
}

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig!, endpointSecret);
    // console.log('Webhook event verified:', event.type);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'payment_intent.created': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        
        // Find service request with this payment hold ID
        // const serviceRequest = await prisma.serviceRequest.findFirst({
        //   where: { paymentHoldId: paymentIntent.id }
        // })
        const serviceRequest =  await prisma.serviceRequest.findFirst({
          where: { id: paymentIntent.metadata.serviceRequestId as string }
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

      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        const paymentEmail = paymentIntent.receipt_email;
        console.log('paymentIntent succeeded:', paymentIntent)
        // Find service request with this payment hold ID
        // const serviceRequest = await prisma.serviceRequest.findFirst({
        //   where: { paymentHoldId: paymentIntent.id }
        // })

        // if (serviceRequest) {
        //   // Update service request status to PAYMENT_COMPLETED
        //   await prisma.serviceRequest.update({
        //     where: { id: serviceRequest.id },
        //     data: {
        //       status: ServiceStatus.PAYMENT_AUTHORIZED
        //     }
        //   })
        // }

        break
      }

      case 'checkout.session.completed': {
        const session = await stripe.checkout.sessions.retrieve(
          event.data.object.id, {
            expand: ['line_items']
          }
        );

        // console.log('Checkout session completed:', session);

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

        // console.log('Subscription:', subscription);

        const product = await stripe.products.retrieve(subscription.items.data[0].price.product as string);

        // console.log('Product:', product);

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
            stripeCustomerId: customerId,
            stripeSubscriptionPlan: planName as SubscriptionPlan,
            stripeSubscriptionStatus: subscription.id ? 'ACTIVE' as SubscriptionStatus : null,
            stripeSubEndingDate: new Date(new Date().setMonth(new Date().getMonth() + 1)),
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

        // console.log('User updated with subscription details');
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

      case "invoice.payment_succeeded": {
        const invoice = event.data.object
        await prisma.user.update({
          where: { email: invoice.customer_email! },
          data: {
            lastTransactionId: typeof invoice.charge === 'string' ? invoice.charge : null,
          }
        })
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error handling webhook:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}