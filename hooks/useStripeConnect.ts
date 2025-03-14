import { useState, useEffect } from "react";
import { loadConnectAndInitialize } from "@stripe/connect-js";

import type { StripeConnectInstance } from "@stripe/connect-js";

const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

if (!stripePublishableKey) {
  throw new Error("Missing Stripe publishable key");
}

export const useStripeConnect = (connectedAccountId: unknown) => {
  const [stripeConnectInstance, setStripeConnectInstance] = useState<StripeConnectInstance | undefined>(undefined);

  useEffect(() => {
    if (connectedAccountId) {
      const fetchClientSecret = async () => {
        const response = await fetch("/api/stripe/account_session", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            account: connectedAccountId,
          }),
        });

        if (!response.ok) {
          // Handle errors on the client side here
          const {error} = await response.json();
          return error;
        } 
        const { clientSecret } = await response.json();
        return clientSecret;
      };

      setStripeConnectInstance(
        loadConnectAndInitialize({
          publishableKey: stripePublishableKey,
          fetchClientSecret,
          appearance: {
            overlays: "dialog",
            variables: {
              colorPrimary: "#635BFF",
            },
          },
        })
      );
    }
  }, [connectedAccountId]);

  return stripeConnectInstance;
};

export default useStripeConnect;