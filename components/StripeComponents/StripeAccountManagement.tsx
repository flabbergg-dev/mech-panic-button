import React, { useEffect, useState, useRef } from 'react';
import {
  ConnectComponentsProvider,
  ConnectAccountManagement,
} from '@stripe/react-connect-js';
import { loadConnectAndInitialize } from '@stripe/connect-js/pure';
import { getStripeConnectId } from '@/app/actions/user/get-stripe-connect-id';

const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

if (!stripePublishableKey) {
  throw new Error("Missing Stripe publishable key. Please set NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY environment variable.");
}

export const StripeAccountManagement = () => {
  const [stripeConnectId, setStripeConnectId] = useState<string | null>(null);
  const stripeConnectInstanceAccount = useRef<ReturnType<typeof loadConnectAndInitialize> | null>(null);

  useEffect(() => {
    const fetchStripeConnectId = async () => {
      const response = await getStripeConnectId();

      if (response) {
        setStripeConnectId(response.stripeConnectId);
      } else {
        console.error('Error fetching Stripe Connect ID');
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
    if (!stripeConnectInstanceAccount.current) {
      stripeConnectInstanceAccount.current = loadConnectAndInitialize({
        publishableKey: stripePublishableKey,
        fetchClientSecret,
        appearance: {
          overlays: 'dialog',
          variables: {
            colorPrimary: '#625afa',
          },
        },
      });
    }
  }, [stripeConnectId]);

  if (!stripeConnectId || !stripeConnectInstanceAccount.current) {
    return <div>Loading...</div>;
  }

  return (
    <div className="pt-4 flex md:flex-row flex-col">
      <div className="bg-background w-[100%] h-fit p-2 rounded-md border-2 border-primary items-center flex justify-center">
        <ConnectComponentsProvider connectInstance={stripeConnectInstanceAccount.current}>
          <ConnectAccountManagement
            // Optional:
            collectionOptions={{
              fields: 'eventually_due',
              futureRequirements: 'include',
            }}
          />
        </ConnectComponentsProvider>
      </div>
    </div>
  );
};