import { getStripeConnectId } from "@/app/actions/user/get-stripe-connect-id";
import { loadConnectAndInitialize } from "@stripe/connect-js";
import {
  ConnectComponentsProvider,
  ConnectPayments,
} from "@stripe/react-connect-js";
import React, { useEffect, useState, useRef } from "react";

export const StripeAccountTxHistory = () => {
  const [stripeConnectId, setStripeConnectId] = useState<string | null>(null);
  const stripeConnectInstance = useRef<any>(null);

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

    const fetchClientSecret = async () => {
      const response = await fetch("/api/stripe/tx-history", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          destinationAccount: stripeConnectId,
        }),
      });

      if (!response.ok) {
        const { error } = await response.json();
        return undefined;
      } else {
        const { client_secret: clientSecret } = await response.json();
        return clientSecret;
      }
    };

    // Initialize the Stripe instance
    stripeConnectInstance.current = loadConnectAndInitialize({
      publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
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