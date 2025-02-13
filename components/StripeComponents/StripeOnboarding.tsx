import React, { useState } from "react";
import { useStripeConnect } from "@/hooks/useStripeConnect";
import {
  ConnectAccountOnboarding,
  ConnectComponentsProvider,
} from "@stripe/react-connect-js";
import { Button } from "../ui/button";
import {stripe} from '@/lib/stripe';
import { updateStripeCustomerId } from "@/app/actions/user/update-stripe-customer-id";
export const StripeOnboarding = () => {
  const [accountCreatePending, setAccountCreatePending] = useState(false);
  const [onboardingExited, setOnboardingExited] = useState(false);
  const [error, setError] = useState(false);
  const [connectedAccountId, setConnectedAccountId] = useState();
  const stripeConnectInstance = useStripeConnect(connectedAccountId);

  const handleOnClickEvent = async () => {
    fetch("/api/stripe/account", {
      method: "GET",
    })
      .then((response) => response.json())
      .then((json) => {
        setAccountCreatePending(false);
        const { account, error } = json;

        if (account) {
          setConnectedAccountId(account);
        }

        console.log(account + "account out side");

        if (error) {
          console.error("Error creating account:", error);
          setError(true);
        }
      });

      if(connectedAccountId){
        updateStripeCustomerId("userId", connectedAccountId)
      }
  }

  return (
    <div className="container">
      <div className="content">
        {connectedAccountId && !stripeConnectInstance && (
          <h2>Add information to start accepting money</h2>
        )}
        {!accountCreatePending && !connectedAccountId && (
          <div>
            <Button
              onClick={async () => {
                setAccountCreatePending(true);
                setError(false);
                handleOnClickEvent();
              }}
            >
              Sign up
            </Button>
          </div>
        )}
        {stripeConnectInstance && (
          <ConnectComponentsProvider connectInstance={stripeConnectInstance}>
            <ConnectAccountOnboarding
              onExit={() => setOnboardingExited(true)}
            />
          </ConnectComponentsProvider>
        )}
        {error && <p className="error">Something went wrong!</p>}
        {(connectedAccountId || accountCreatePending || onboardingExited) && (
          <div className="dev-callout">
            {connectedAccountId && (
              <p>
                Your connected account ID is:{" "}
                <code className="bold">{connectedAccountId}</code>
              </p>
            )}
            {accountCreatePending && <p>Creating a connected account...</p>}
            {onboardingExited && (
              <p>The Account Onboarding component has exited</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
