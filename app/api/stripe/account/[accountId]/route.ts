import { NextResponse } from "next/server"
import {stripe} from '@/lib/stripe';

type RouteParams = {
  requestId: string
}

export async function GET(
  request: Request,
  { params }: { params: Promise<RouteParams> }
) {
    try {
        // const { id } = await req.json();
        const { requestId } = await params;
        const id = requestId;
        if (!id) {
            return new NextResponse("Account ID cannot be empty", { status: 400 })
        } else {
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
        }
    }
    catch (error) {
        console.error('An error occurred when calling the Stripe API to withdraw funds:', error);
        return new NextResponse("Internal Error", { status: 500 })
    }
}