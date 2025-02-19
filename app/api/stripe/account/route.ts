import {stripe} from '@/lib/stripe';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
      const account = await stripe.accounts.create({
        controller: {
          stripe_dashboard: {
            type: 'none',
          },
          fees: {
            payer: "application"
          },
          losses: {
            payments: "application"
          },
          requirement_collection: "application",
        },
        capabilities: {
          transfers: {requested: true}
        },
        country: "US",
      });

      if (account.details_submitted === false) {
        console.log('Account created but requires additional information:', account.id);
        return new NextResponse("Account created but requires additional information", { status: 400 });
      } else {
        return NextResponse.json({account: account.id});
      }

    } catch (error) {
      console.error('An error occurred when calling the Stripe API to create an account:', error);
      return new NextResponse("Internal Error", { status: 500 })
    }
}
