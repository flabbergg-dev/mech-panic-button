import React, { useEffect, useState, useRef } from "react";
import {
  ConnectComponentsProvider,
  ConnectBalances,
} from "@stripe/react-connect-js";
import { loadConnectAndInitialize } from "@stripe/connect-js/pure";
import { getStripeConnectId } from "@/app/actions/user/get-stripe-connect-id";

const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

if (!stripePublishableKey) {
  throw new Error("Missing Stripe publishable key");
}

export const StripeAccountBalance = () => {
  const [stripeConnectId, setStripeConnectId] = useState<string | null>(null);
  const stripeConnectInstance = useRef<ReturnType<typeof loadConnectAndInitialize> | null>(null);

  useEffect(() => {
    const fetchStripeConnectId = async () => {
      const response = await getStripeConnectId();

      if (response) {
        setStripeConnectId(response.stripeConnectId);
      } else {
        console.error("Error fetching Stripe Connect ID");
      }
    };

    if (!stripeConnectId) {
      fetchStripeConnectId();
    }
  }, [stripeConnectId]);

  useEffect(() => {
    if (!stripeConnectId) return;

    const fetchClientSecret = async (): Promise<string> => {
      const response = await fetch('/api/stripe/connect/client-secret', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accountId: stripeConnectId,
        }),
      });

      if (!response.ok) {
        const { error } = await response.json();
        throw new Error(error || 'Failed to fetch client secret');
      }

      const { clientSecret } = await response.json();
      if (!clientSecret) {
        throw new Error('No client secret received');
      }

      return clientSecret;
    };

    // Initialize the Stripe instance
    stripeConnectInstance.current = loadConnectAndInitialize({
      publishableKey: stripePublishableKey,
      fetchClientSecret: fetchClientSecret,
      appearance: {
        overlays: "dialog",
        variables: {
          colorPrimary: "#625afa",
        },
      },
    });
  }, [stripeConnectId]);

  if (!stripeConnectId || !stripeConnectInstance.current) {
    return <div>Loading...</div>;
  }

  return (
    <div className="pt-4 flex md:flex-row flex-col gap-10">
      <div className="bg-white w-fit h-fit p-10 rounded-md border-2 border-primary">
        <ConnectComponentsProvider
          connectInstance={stripeConnectInstance.current}
        >
          <ConnectBalances />
        </ConnectComponentsProvider>
      </div>
    </div>
  );
};
