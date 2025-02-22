import {stripe} from '@/lib/stripe';
import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server'
import { updateUserStripeInfo } from '@/app/actions/user/update-user-stripe-info';
export async function POST(req: Request) {
    try {
        const { subscriptionId } = await req.json();
        const user = await currentUser()

        if (!subscriptionId) {
            return new NextResponse("Subscription ID cannot be empty", { status: 400 })
        } else {
            const subscription = await stripe.subscriptions.cancel(
            subscriptionId,
            );
            await updateUserStripeInfo(user!.id, "", "CANCELED");
            return NextResponse.json({
                subscription: subscription
            });
        }

        // Update the subscription id of the user in the database
    }
    catch (error) {
        console.error('An error occurred when calling the Stripe API to create a subscription:', error);
        return new NextResponse("Internal Error", { status: 500 })
    }
}