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
//   for (const [key, value] of headersList.entries()) {
//   console.log(`${key}: ${value}`);
// }

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
      // This case is used upon creation of payment related event
      // even if the payment fails we will know which tx it was
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

        const serviceOffer = await prisma.serviceOffer.findFirst({
          where: { serviceRequestId: paymentIntent.metadata.serviceRequestId }
        });

        const serviceRequest = await prisma.serviceRequest.findUnique({
          where: { id: paymentIntent.metadata.serviceRequestId }
        });

        if (serviceRequest) {
            // Check if the service request status is not SERVICING
            if (serviceRequest.firstTransactionId === null) {
              // Update service request status to PAYMENT_AUTHORIZED
              await prisma.serviceRequest.update({
                where: { id: serviceRequest.id },
                data: {
                status: ServiceStatus.PAYMENT_AUTHORIZED,
                totalAmount: serviceOffer?.price,
                firstTransactionId: paymentIntent.latest_charge as string
                }
              });
            } else {
              await prisma.serviceRequest.update({
                where: { id: serviceRequest.id },
                data: {
                status: ServiceStatus.SERVICING,
                totalAmount: serviceOffer?.price,
                secondTransactionId: paymentIntent.latest_charge as string
                }
              });

              await prisma.serviceOffer.update({
                where: { id: serviceOffer?.id },
                data: {
                  status: 'ACCEPTED'
                }
              });
            }

            const user = await prisma.user.findUnique({
              where: { id: serviceRequest.clientId! }
            });

            if (user) {
              if (user.firstTransactionId) {
                await prisma.user.update({
                  where: { id: serviceRequest.clientId! },
                  data: {
                    secondTransactionId: paymentIntent.latest_charge as string
                  }
                });
              } else {
                await prisma.user.update({
                  where: { id: serviceRequest.clientId! },
                  data: {
                    firstTransactionId: paymentIntent.latest_charge as string
                  }
                });
              }
            }
        }
        break
      }

      // this case handles subscription details and customer,
      // connect and other fields related to stripe account information
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
        // Check if the event is related to a subscription
        if ((event.data.object as Stripe.Checkout.Session).subscription) {
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
        }


        break;
      }

      // This case is used to only handle subscriptions delete events
      case 'customer.subscription.deleted': {
        const subscriptionUser = event.data.object.customer

        const user = await prisma.user.findFirst({
          where: {
            stripeCustomerId: subscriptionUser as string
          }
        })

        const subscription = await stripe.subscriptions.retrieve(
          event.data.object.id
        );

        console.log('Subscription deleted:', subscription);

        if (event) {
          await prisma.user.update({
            where: { email: user?.email },
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

      // This case is used for *INVOICES* after the payment succeeded usually used
      // to update transactin fields in the db
      // case "invoice.payment_succeeded": {
      //   const invoice = event.data.object
      //   await prisma.user.update({
      //     where: { email: invoice.customer_email! },
      //     data: {
      //       firstTransactionId: typeof invoice.charge === 'string' ? invoice.charge : null,
      //     }
      //   })
      // }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('Error processing webhook:', err);
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}