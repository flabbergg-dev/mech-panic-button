import {stripe} from '@/lib/stripe';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const { destinationAccount } = await req.json();

        const accountSession = await stripe.accountSessions.create({
        account: destinationAccount,
        components: {
            payments: {
            enabled: true,
            features: {
                refund_management: true,
                dispute_management: true,
                capture_payments: true,
                destination_on_behalf_of_charge_management: false,
            },
            },
        },
        });

        return NextResponse.json({
            client_secret: accountSession.client_secret,
        });
    } catch (error) {
        console.error('An error occurred when calling the Stripe API to get users funds:', error);
        return new NextResponse("Internal Error", { status: 500 })
    }
  }