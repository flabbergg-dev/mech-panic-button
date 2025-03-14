import {stripe} from '@/lib/stripe';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    try {
        const accounts = await stripe.accounts.list({
        limit: 40,
        });
        for (const account of accounts.data) {
            const deleted = await stripe.accounts.del(account.id);
        }
        return NextResponse.json({accounts: accounts.data});
    } catch (error) {
      console.error('An error occurred when calling the Stripe API to fetch finacial accounts', error);
      return new NextResponse("Internal Error", { status: 500 })
    }
}
