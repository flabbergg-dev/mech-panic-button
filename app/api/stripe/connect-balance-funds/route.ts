import { stripe } from '@/lib/stripe';
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import type Stripe from 'stripe';

export async function POST(req: Request) {
    try {
        // Get authenticated user
        const { userId } = await auth();
        if (!userId) {
            console.error('No authenticated user found');
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        // Get account ID from request
        const { accountId } = await req.json();
        console.log('Received request for account:', accountId);

        if (!accountId) {
            console.error('No accountId provided in request');
            return NextResponse.json(
                { error: "accountId is required" },
                { status: 400 }
            );
        }

        // Verify the account exists
        let stripeAccount: Stripe.Account;
        try {
            stripeAccount = await stripe.accounts.retrieve(accountId);
            
            // Check if account is deleted using type guard
            if ('deleted' in stripeAccount && stripeAccount.deleted) {
                console.error('Deleted Stripe account:', accountId);
                return NextResponse.json(
                    { error: "Invalid Stripe Connect account" },
                    { status: 400 }
                );
            }
        } catch (error) {
            console.error('Error verifying Stripe account:', error);
            return NextResponse.json(
                { error: "Invalid Stripe Connect account" },
                { status: 400 }
            );
        }

        // Get balance for the account
        console.log('Fetching balance for account:', accountId);
        const balance = await stripe.balance.retrieve({
            stripeAccount: accountId,
        });

        const available = balance.available[0]?.amount || 0;
        const pending = balance.pending[0]?.amount || 0;

        console.log('Balance retrieved:', { available, pending });

        return NextResponse.json({
            available,
            pending,
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