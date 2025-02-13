import React, { useState } from 'react'
import { Button } from '../ui/button';
import { loadStripe } from "@stripe/stripe-js";
import { CheckoutProvider, EmbeddedCheckout, EmbeddedCheckoutProvider } from '@stripe/react-stripe-js';

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

export const StripeSubscribe = () => {
  const [error, setError] = useState(false);
  const [sessionId, setSessionId] = useState();
  const [secret, setSecret] = useState();
  const handleOnClickEvent = async () => {
    try {
    await fetch("/api/stripe/subscriptionPlans/basic", {
      method: "POST",
    })
      .then((response) => response.json())
      .then((json) => {
        const { session, sessionSecret, error } = json;

        if (session) {
          setSessionId(session);
          console.log(session + "session");
        }

        if (sessionSecret) {
          setSecret(sessionSecret);
          console.log(sessionSecret + "sessionSecret");
        }

        if (error) {
          console.error("Error creating account:", error);
          setError(true);
        }
      });
    } catch (error) {
      console.error("Error creating account:", error);
      setError(true);
    }
  }

  return (
    <>
      <Button
        onClick={async () => {
          setError(false);
          handleOnClickEvent();
        }}
        disabled={sessionId}
      >
        Subscribe basic
      </Button>
      {secret && (
        <EmbeddedCheckoutProvider
          stripe={stripePromise}
          options={{ clientSecret: secret }}
        >
          <EmbeddedCheckout className='absolute top-0 bottom-0 left-0 right-0'/>
        </EmbeddedCheckoutProvider>
      )}
      {sessionId && <p>Redirecting to checkout...</p>}
      {error && <p className="error">Something went wrong!</p>}
    </>
  );
}
