import React, { useEffect, useState } from "react";
import { useStripeConnect } from "@/hooks/useStripeConnect";
import {
  ConnectAccountOnboarding,
  ConnectComponentsProvider,
} from "@stripe/react-connect-js";
import { Button } from "../ui/button";
import { useToast } from "@/hooks/use-toast";

type StripeOnboardingProps = {
  stripeAccountId: string | null;
  setStripeAccountId: (stripeAccountId: string) => void;
  setCurrentStep: (step: "documents" | "StripeAccountSetup") => void;
};

export const StripeOnboarding = ({stripeAccountId, setStripeAccountId, setCurrentStep} : StripeOnboardingProps) => {
  const [accountCreatePending, setAccountCreatePending] = useState(false);
  const [onboardingExited, setOnboardingExited] = useState(false);
  const [error, setError] = useState(false);
  const stripeConnectInstance = useStripeConnect(stripeAccountId);
  const { toast } = useToast();

  const handleOnClickEvent = async () => {
    setAccountCreatePending(true);
    setError(false);

    await fetch("/api/stripe/account", {
      method: "POST",
    })
      .then((response) => response.json())
      .then((json) => {
        setAccountCreatePending(false);
        const { account, error } = json;

        if (account) {
          setStripeAccountId(account);
        }

        if (error) {
          console.error("Error creating account:", error);
          setError(true);
          toast({
            title: "Error",
            description: "An error occurred while creating your account",
            variant: "destructive",
          });
        }
      });
  }

  const handleExit = () => {
    if (stripeAccountId) {
      setOnboardingExited(true);
      setCurrentStep("documents");
      console.log("Stripe account created:", stripeAccountId);
      toast({
        title: "Success",
        description: "Your account has been created",
      })
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
              onClick={() => {
                handleOnClickEvent();
              }}
            >
              Start Onboarding
            </Button>
          </div>
        )}
        {stripeConnectInstance && (
          <div className="absolute top-0 left-0 right-0 bottom-0 h-[35dvh]">
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
