import {stripe} from '@/lib/stripe';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const { destinationAccount } = await req.json();

        const balance = await stripe.balance.retrieve({
        stripeAccount: destinationAccount,
        });

        return NextResponse.json({
            balance: balance.available[0].amount,
        });
    }
    catch (error) {
        console.error('An error occurred when calling the Stripe API to get users funds:', error);
        return new NextResponse("Internal Error", { status: 500 })
    }
}