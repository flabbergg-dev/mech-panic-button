import React, { useState } from 'react'
import { Button } from '../ui/button';
import { loadStripe } from "@stripe/stripe-js";
import { EmbeddedCheckout, EmbeddedCheckoutProvider } from '@stripe/react-stripe-js';
import { Card, CardContent, CardDescription, CardFooter, CardHeader } from '../ui/card';
import { useAuth } from '@clerk/nextjs';
const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

export const StripeSubscribe = () => {
  const { userId } = useAuth();
  const [error, setError] = useState(false);
  const [sessionId, setSessionId] = useState();
  const [secret, setSecret] = useState();
  const handleOnClickEventBasic = async () => {
    try {
    await fetch("/api/stripe/subscriptionPlans/basic", {
      method: "POST",
    })
      .then((response) => response.json())
      .then(async (json) => {
        const { session, sessionSecret, error } = json;

        if (session) {
          setSessionId(session);
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

  const handleOnClickEventPro = async () => {
    try {
      await fetch("/api/stripe/subscriptionPlans/pro", {
        method: "POST",
      })
        .then((response) => response.json())
        .then(async (json) => {
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
  };

  return (
    <div className="flex gap-4 items-center justify-between pt-4">
      <Card className="w-6/12 h-auto">
        <CardContent>
          <CardHeader className='font-bold text-3xl'>Basic</CardHeader>
          <CardDescription className={"text-lg w-auto mx-6 mb-6"}>
            $10 per month - includes availability to provide onDemand service
          </CardDescription>
          <CardFooter className="flex items-center justify-end">
            <Button
              onClick={async () => {
                setError(false);
                handleOnClickEventBasic();
              }}
              disabled={sessionId}
            >
              Subscribe basic
            </Button>
          </CardFooter>
        </CardContent>
      </Card>
      <Card className="w-6/12 h-auto">
        <CardContent>
          <CardHeader className='font-bold text-3xl'>Pro</CardHeader>
          <CardDescription className={"text-lg w-auto mx-6 mb-6"}>
            $15 per month - includes onDemand and scheduling
          </CardDescription>
          <CardFooter className="flex items-center justify-end">
            <Button
              onClick={async () => {
                setError(false);
                handleOnClickEventPro();
              }}
              disabled={sessionId}
            >
              Subscribe pro
            </Button>
          </CardFooter>
        </CardContent>
      </Card>
      {secret && (
        <EmbeddedCheckoutProvider
          stripe={stripePromise}
          options={{ clientSecret: secret }}
        >
          <EmbeddedCheckout className="absolute top-0 bottom-0 left-0 right-0" />
        </EmbeddedCheckoutProvider>
      )}
      {sessionId && <p>Redirecting to checkout...</p>}
      {error && <p className="error">Something went wrong!</p>}
    </div>
  );
}
