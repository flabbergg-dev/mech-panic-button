import React, { useEffect, useState } from "react";
import { useStripeConnect } from "@/hooks/useStripeConnect";
import {
  ConnectAccountOnboarding,
  ConnectComponentsProvider,
} from "@stripe/react-connect-js";
import { Button } from "../ui/button";
import { toast } from "@/hooks/use-toast";

type StripeOnboardingProps = {
  setCurrentStep: (step: "documents" | "StripeAccountSetup") => void;
  stripeAccountId: string | null;
  setStripeAccountId: (stripeAccountId: string) => void;
};

export const StripeOnboarding = ({setCurrentStep, stripeAccountId, setStripeAccountId} : StripeOnboardingProps) => {
  const [accountCreatePending, setAccountCreatePending] = useState(false);
  const [onboardingExited, setOnboardingExited] = useState(false);
  const [error, setError] = useState(false);
  const [tempLocation, setTempLocation] = useState("");
  const stripeConnectInstance = useStripeConnect(stripeAccountId);

  const handleOnClickEvent = async () => {
    await fetch("/api/stripe/account", {
      method: "GET",
    })
      .then((response) => response.json())
      .then((json) => {
        setAccountCreatePending(false);
        const { account, error } = json;

        if (account) {
          setTempLocation(account);
        }

        if (error) {
          console.error("Error creating account:", error);
          setError(true);
        }
      });
  }

  const handleExit = () => {
    if (tempLocation && onboardingExited) {
      setOnboardingExited(true);
      setStripeAccountId(tempLocation);
    }
  };

  return (
    <div className="container h-[35dvh]">
      <div className="content">
        {stripeAccountId && !stripeConnectInstance && (
          <h2>Add information to start accepting money</h2>
        )}
        {!accountCreatePending && !stripeAccountId && (
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
          <div className="absolute top-0 left-0 right-0 bottom-0 h[35dvh]-">
            <ConnectComponentsProvider connectInstance={stripeConnectInstance}>
              <ConnectAccountOnboarding onExit={() => handleExit()} />
            </ConnectComponentsProvider>
          </div>
        )}
        {error && <p className="error">Something went wrong!</p>}
        {(stripeAccountId || accountCreatePending || onboardingExited) && (
          <div className="dev-callout">
            {stripeAccountId && (
              <p>
                Your connected account ID is:{" "}
                <code className="bold">{stripeAccountId}</code>
              </p>
            )}
            {accountCreatePending && <p>Creating a connected account...</p>}
            {onboardingExited && (
              <p>The Account Onboarding component has exited</p>
            )}
          </div>
        )}{" "}
      </div>
    </div>
  );
}
