"use server"

import { redirect } from "next/navigation"
import { auth } from "@clerk/nextjs/server"
import { absoluteUrl } from "@/lib/utils"

import { stripe } from "@/lib/stripe"

export type responseAction = {
  status: "success" | "error"
  stripeUrl?: string
}

const billingUrl = absoluteUrl("/dashboard/billing")

export async function openCustomerPortal(
  userStripeId: string
): Promise<responseAction> {
  let redirectUrl: string = ""

  try {
    const session = await auth()

    if (!session?.sessionId || !session?.userId) {
      throw new Error("Unauthorized")
    }

    if (userStripeId) {
      const stripeSession = await stripe.billingPortal.sessions.create({
        customer: userStripeId,
        return_url: billingUrl,
      })

      redirectUrl = stripeSession.url as string
    }
  } catch (error) {
    throw new Error("Failed to generate user stripe session")
  }

  redirect(redirectUrl)
}
