import {stripe} from '@/lib/stripe';
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { currentUser } from '@clerk/nextjs/server'
import { updateUserStripeInfo } from '@/app/actions/user/update-user-stripe-info';

export async function POST(request: Request) {
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
        line_items: [
            {
            price: 'price_1QZJeyKFFfK1VKTSrajuFlMV',
            quantity: 1,
            },
        ],
        mode: 'subscription',
        ui_mode: 'embedded',
        return_url: `${origin}/dashboard/mechanic/${user!.id}?session_id={CHECKOUT_SESSION_ID}`,
        subscription_data: {
            billing_cycle_anchor: billingCycleAnchor,
            proration_behavior: 'none',
        },
        });

        // Update the subscription id of the user in the database
        await updateUserStripeInfo(user!.id, 'sub_1QuinQKFFfK1VKTS6c235Xr2', 'ACTIVE', 'PRO')

        return NextResponse.json({
            session: session.id,
            sessionSecret: session.client_secret,
        });
    }
    catch (error) {
        console.error('An error occurred when calling the Stripe API to create a subscription:', error);
        return new NextResponse("Internal Error", { status: 500 })
    }
}