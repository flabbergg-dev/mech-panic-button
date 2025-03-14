import { getStripeConnectId } from "@/app/actions/user/get-stripe-connect-id";
import { loadConnectAndInitialize } from "@stripe/connect-js";
import {
  ConnectComponentsProvider,
  ConnectPayments,
} from "@stripe/react-connect-js";
import React, { useEffect, useState, useRef } from "react";

const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

if (!stripePublishableKey) {
  throw new Error("Missing Stripe publishable key");
}

export const StripeAccountTxHistory = () => {
  const [stripeConnectId, setStripeConnectId] = useState<string | null>(null);
  const stripeConnectInstance = useRef<ReturnType<typeof loadConnectAndInitialize> | null>(null);

  useEffect(() => {
    const fetchUserId = async () => {
      const response = await getStripeConnectId();

      if (response) {
        setStripeConnectId(response.stripeConnectId);
      } else {
        console.error("Error fetching Stripe Connect ID");
      }
    };

    if (!stripeConnectId) {
      fetchUserId();
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
    <div className="space-y-4 border-2 rounded-md border-slate-300 p-4">
      <ConnectComponentsProvider
        connectInstance={stripeConnectInstance.current}
      >
        <ConnectPayments />
      </ConnectComponentsProvider>
    </div>
  );
};
