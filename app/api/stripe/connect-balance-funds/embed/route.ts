import {stripe} from '@/lib/stripe';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const { id } = await req.json();

        const accountSession = await stripe.accountSessions.create({
        account: id,
        components: {
            balances: {
            enabled: true,
            features: {
                instant_payouts: true,
                standard_payouts: true,
                edit_payout_schedule: true,
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