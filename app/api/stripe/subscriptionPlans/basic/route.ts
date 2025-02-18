import { prisma } from '@/lib/prisma';
import {stripe} from '@/lib/stripe';
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { currentUser } from '@clerk/nextjs/server'
import { updateUserStripeInfo } from '@/app/actions/user/update-user-stripe-info';

export async function POST() {
    try {
        const user = await currentUser()
        const headersList = await headers()
        const origin = headersList.get('origin')
        // Calculate one month from now
        const now = new Date(); // Current date and time
        const oneMonthFromNow = new Date(now.setMonth(now.getMonth() + 1)); // Add one month

        // Subtract one day
        oneMonthFromNow.setDate(oneMonthFromNow.getDate() - 1);

        const billingCycleAnchor = Math.floor(oneMonthFromNow.getTime() / 1000); // Convert to Unix timestamp

        const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: 'subscription',
        line_items: [
            {
                price: 'price_1QrnUvKFFfK1VKTS3O1AjA6K',
                quantity: 1,
            },
        ],
        return_url: `${origin}/dashboard/mechanic/${user!.id}?session_id={CHECKOUT_SESSION_ID}`,
        // automatic_tax: {enabled: true},
        ui_mode: 'embedded',
        subscription_data: {
            billing_cycle_anchor: billingCycleAnchor, // Set the billing cycle anchor to one month from now
            // enable bottom line for first free month off
            // proration_behavior: 'none',
        },
        });
        // Update the subscription id of the user in the database
        await updateUserStripeInfo(user!.id, session.id!, session.status!);

        return NextResponse.json({
            session: session.id,
            sessionSecret: session.client_secret,
        });
        // return NextResponse.redirect(session.url!, 303)
    }
    catch (error) {
        console.error('An error occurred when calling the Stripe API to create a subscription:', error);
        return new NextResponse("Internal Error", { status: 500 })
    }
}