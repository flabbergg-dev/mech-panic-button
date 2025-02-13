import {stripe} from '@/lib/stripe';
import { NextResponse } from 'next/server';
export async function POST(request: Request) {
    try {
        const session = await stripe.checkout.sessions.create({
        line_items: [
            {
            price: 'price_1QZJeyKFFfK1VKTSrajuFlMV',
            quantity: 1,
            },
        ],
        mode: 'subscription',
        ui_mode: 'embedded',
        return_url: 'https://example.com/return?session_id={CHECKOUT_SESSION_ID}',
        subscription_data: {
            billing_cycle_anchor: 1611008505,
            proration_behavior: 'none',
        },
        });

        return NextResponse.json({
            session: session.id,
        });
    }
    catch (error) {
        console.error('An error occurred when calling the Stripe API to create a subscription:', error);
        return new NextResponse("Internal Error", { status: 500 })
    }
}