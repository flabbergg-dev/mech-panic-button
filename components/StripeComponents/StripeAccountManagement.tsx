import React, { useEffect, useState, useRef } from 'react';
import {
  ConnectComponentsProvider,
  ConnectAccountManagement,
} from '@stripe/react-connect-js';
import { loadConnectAndInitialize } from '@stripe/connect-js/pure';
import { getStripeConnectId } from '@/app/actions/user/get-stripe-connect-id';

export const StripeAccountManagement = () => {
  const [stripeConnectId, setStripeConnectId] = useState<string | null>(null);
  const stripeConnectInstanceAccount = useRef<any>(null);

  useEffect(() => {
    const fetchStripeConnectId = async () => {
      const response = await getStripeConnectId();

      if (response) {
        setStripeConnectId(response.stripeConnectId);
        console.log('Stripe Connect ID: ', response.stripeConnectId);
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

    const fetchClientSecret = async () => {
      const response = await fetch('/api/stripe/account/embed', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: stripeConnectId,
        }),
      });

      if (!response.ok) {
        const { error } = await response.json();
        console.log('An error occurred: ', error);
        return undefined;
      } else {
        const { client_secret: clientSecret } = await response.json();
        return clientSecret;
      }
    };

    // Initialize the Stripe instance
    stripeConnectInstanceAccount.current = loadConnectAndInitialize({
      publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
      fetchClientSecret: fetchClientSecret,
      appearance: {
        overlays: 'dialog',
        variables: {
          colorPrimary: '#625afa',
        },
      },
    });
  }, [stripeConnectId]);

  if (!stripeConnectId || !stripeConnectInstanceAccount.current) {
    return <div>Loading...</div>;
  }

  return (
    <div className="pt-4 flex md:flex-row flex-col gap-10">
      <div className="bg-white w-[100%] h-fit p-10 rounded-md border-2 border-primary">
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