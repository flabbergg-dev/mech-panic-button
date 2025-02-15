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
    const resolvedParams = await params

    if (!resolvedParams.requestId) {
      return new NextResponse("Invalid request ID", { status: 400 })
    }

    const account = await stripe.accounts.retrieve(resolvedParams.requestId);

    console.log('Account retrieved:', account.id);

    return NextResponse.json({account: account});

  } catch (error) {
    console.error("Error retrieving account information:", error)
    return new NextResponse("Internal error", { status: 500 })
  }
}