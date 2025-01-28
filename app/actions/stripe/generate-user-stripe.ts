"use server"

import { redirect } from "next/navigation"
import { auth } from "@clerk/nextjs/server"
import { absoluteUrl } from "@/lib/utils"

import { stripe } from "@/lib/stripe"
import { getUserSubscriptionPlan } from "@/lib/subscription"

export type responseAction = {
  status: "success" | "error"
  stripeUrl?: string
}

// const billingUrl = absoluteUrl("/dashboard/billing")
const billingUrl = absoluteUrl("/pricing")

export async function generateUserStripe(
  priceId: string
): Promise<responseAction> {
  let redirectUrl: string = ""

  try {
    // const { userId } = await auth()
    //     const user = await currentUser()
    const session = await auth()
    const user = session?.userId

    if (!session?.sessionId || !session?.userId) {
      throw new Error("Unauthorized")
    }

    const subscriptionPlan = await getUserSubscriptionPlan(user!)

    if (subscriptionPlan.isPaid && subscriptionPlan.stripeCustomerId) {
      // User on Paid Plan - Create a portal session to manage subscription.
      const stripeSession = await stripe.billingPortal.sessions.create({
        customer: subscriptionPlan.stripeCustomerId,
        return_url: billingUrl,
      })

      redirectUrl = stripeSession.url as string
    } else {
      // User on Free Plan - Create a checkout session to upgrade.
      const stripeSession = await stripe.checkout.sessions.create({
        success_url: billingUrl,
        cancel_url: billingUrl,
        payment_method_types: ["card"],
        mode: "subscription",
        billing_address_collection: "auto",
        // customer_email: user.email,
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        metadata: {
          userId: user,
        },
      })

      redirectUrl = stripeSession.url as string
    }
  } catch (error) {
    throw new Error("Failed to generate user stripe session")
  }

  // no revalidatePath because redirect
  redirect(redirectUrl)
}
