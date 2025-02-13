import { prisma } from '@/lib/prisma';
import {stripe} from '@/lib/stripe';
import { NextResponse } from 'next/server';
export async function POST(request: Request) {
    try {

        // Calculate one month from now
        const now = new Date(); // Current date and time
        const oneMonthFromNow = new Date(now.setMonth(now.getMonth() + 1)); // Add one month

        // Subtract one day
        oneMonthFromNow.setDate(oneMonthFromNow.getDate() - 1);

        const billingCycleAnchor = Math.floor(oneMonthFromNow.getTime() / 1000); // Convert to Unix timestamp

        const session = await stripe.checkout.sessions.create({
        line_items: [
            {
            price: 'price_1QrnUvKFFfK1VKTS3O1AjA6K',
            quantity: 1,
            },
        ],
        mode: 'subscription',
        success_url: 'http://localhost:3000/onboarding/success?session_id={CHECKOUT_SESSION_ID}',
        // embedded checkout
        // ui_mode: 'embedded',
        // return_url: 'http://localhost:3000/onboarding/return?session_id={CHECKOUT_SESSION_ID}',
        subscription_data: {
            billing_cycle_anchor: billingCycleAnchor, // Set the billing cycle anchor to one month from now
            // enable bottom line for first free month off
            // proration_behavior: 'none',
        },
        });

        // Update the subscription id of the user in the database
        // await prisma.user.update({
        //     where: { id: stripeSubscriptionId },
        //     data: {
        //     stripeSubscriptionId: session.id,
        //     stripeSubscriptionPlan: 'BASIC',
        //     },
        // })

        return NextResponse.json({
            session: session.id,
        });
    }
    catch (error) {
        console.error('An error occurred when calling the Stripe API to create a subscription:', error);
        return new NextResponse("Internal Error", { status: 500 })
    }
}