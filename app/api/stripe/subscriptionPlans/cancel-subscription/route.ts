import {stripe} from '@/lib/stripe';
import { NextResponse } from 'next/server';
// import { currentUser } from '@clerk/nextjs/server'
// import { updateStripesubscriptionId } from '@/app/actions/user/update-stripe-subscription-id';

export async function POST() {
    try {
        // const user = await currentUser()

        const subscription = await stripe.subscriptions.cancel(
        'si_RmtyW07Drnxtis'
        );

        // Update the subscription id of the user in the database
        // await updateStripesubscriptionId(user!.id, subscription.id!)

        return NextResponse.json({
            subscription: subscription
        });
    }
    catch (error) {
        console.error('An error occurred when calling the Stripe API to create a subscription:', error);
        return new NextResponse("Internal Error", { status: 500 })
    }
}