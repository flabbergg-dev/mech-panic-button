import {stripe} from '@/lib/stripe';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const { amount, destination } = await req.json();
        const transfer = await stripe.transfers.create({
        amount: amount,
        currency: 'usd',
        destination: destination,
        transfer_group: 'ORDER' + Math.random().toString(36).substring(7),
        });


        return NextResponse.json({
            transfer: transfer,
        });
    }
    catch (error) {
        console.error('An error occurred when calling the Stripe API to withdraw funds:', error);
        return new NextResponse("Internal Error", { status: 500 })
    }
}