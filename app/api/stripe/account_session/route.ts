import {stripe} from '@/lib/stripe';
import { NextResponse } from 'next/server';
export async function POST(request: Request) {
    try {
      const {account} = await request.json();
      const accountSession = await stripe.accountSessions.create({
        account: account,
        // account: "{{CONNECTED_ACCOUNT_ID}}",
        components: {
          account_onboarding: { enabled: true },
          payments: {
            enabled: true,
            features: {
              refund_management: true,
              dispute_management: true,
              capture_payments: true,
            }
          }
        }
      });

      if (!accountSession.client_secret) {
        throw new Error('No client secret found in account session');
      }

      return NextResponse.json({
        client_secret: accountSession.client_secret,
      });
    } catch (error) {
      console.error('An error occurred when calling the Stripe API to get session:', error);
      return new NextResponse("Internal Error", { status: 500 })
  }
}
