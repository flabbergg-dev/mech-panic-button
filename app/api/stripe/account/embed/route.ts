import { NextResponse } from "next/server";
import { stripe } from '@/lib/stripe';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { id } = body;

    if (!id) {
      return new NextResponse("Account ID cannot be empty", { status: 400 });
    }

    const accountSession = await stripe.accountSessions.create({
      account: id,
      components: {
        account_management: {
          enabled: true,
          features: {
            external_account_collection: true,
          },
        },
      },
    });

    return NextResponse.json({
      client_secret: accountSession.client_secret,
    });
  } catch (error) {
        console.error('An error occurred when calling the Stripe API to withdraw funds:', error);
        return new NextResponse("Internal Error", { status: 500 })
  }
}