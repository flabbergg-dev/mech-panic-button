import {stripe} from '@/lib/stripe';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const { destinationAccount } = await req.json();

        if (!destinationAccount) {
            return NextResponse.json(
                { error: "destinationAccount is required" },
                { status: 400 }
            );
        }

        const balance = await stripe.balance.retrieve({
        stripeAccount: destinationAccount,
        });

        const available = balance.available[0]?.amount || 0;

        return NextResponse.json({
            available,
            pending: balance.pending[0]?.amount || 0,
        });
    }
    catch (error) {
        console.error('An error occurred when calling the Stripe API to get users funds:', error);
        
        return NextResponse.json(
            { 
                error: error instanceof Error ? error.message : "Internal server error",
                available: 0,
                pending: 0
            },
            { status: 500 }
        );
    }
}