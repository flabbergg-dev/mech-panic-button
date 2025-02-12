import {stripe} from '@/lib/stripe';
import { NextResponse } from 'next/server';
export async function POST(request: Request) {
    try {
      const body = await request.json();
      const accountSession = await stripe.accountSessions.create({
        account: body.account,
        components: {
          account_onboarding: { enabled: true },
        }
      });

      return NextResponse.json({
        client_secret: accountSession.client_secret,
      });
    } catch (error) {
      console.error('An error occurred when calling the Stripe API to get session:', error);
      return new NextResponse("Internal Error", { status: 500 })
  }
}
